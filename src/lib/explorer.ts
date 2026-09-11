import type {
  BinaryMarket,
  BinarySide,
  MarketActivity,
} from "@somnia-chain/markets-sdk";

import {
  getDreamdexMarket,
  listDreamdexMarketActivity,
  listDreamdexMarkets,
} from "./dreamdex";
import { loadActionScores } from "./persist";
import type {
  ActionType,
  ActorType,
  ExplorerAction,
  ExplorerActor,
  ExplorerMarket,
  ExplorerSnapshot,
  MarketOutcome,
  RiskResult,
} from "./types";

const MARKET_LIMIT = 50;
const ACTIVITY_MARKET_LIMIT = 12;
const ACTIVITY_LIMIT = 25;

const EMPTY_DATE = new Date(0).toISOString();

export async function getExplorerSnapshot(): Promise<ExplorerSnapshot> {
  try {
    const rawMarkets = await listDreamdexMarkets(MARKET_LIMIT);
    const activityTargets = rawMarkets
      .filter((market) => toInteger(market.tradeCount) > 0)
      .slice(0, ACTIVITY_MARKET_LIMIT);

    const activityResults = await Promise.allSettled(
      activityTargets.map(async (market) => ({
        market,
        activity: await listDreamdexMarketActivity(market, ACTIVITY_LIMIT),
      })),
    );

    const actionsByMarket = new Map<string, ExplorerAction[]>();
    let failedActivityReads = 0;

    for (const result of activityResults) {
      if (result.status === "rejected") {
        failedActivityReads += 1;
        continue;
      }

      const actions = result.value.activity.map((activity) =>
        normalizeAction(activity, result.value.market),
      );

      actionsByMarket.set(result.value.market.id, actions);
    }

    const rawActions = [...actionsByMarket.values()]
      .flat()
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
    const actions = await withPersistedScores(rawActions);
    const markets = rawMarkets.map((market) =>
      normalizeMarket(
        market,
        actions.filter((action) => action.marketId === market.id),
      ),
    );
    const actors = buildActors(actions);
    const leaderboard = actors
      .filter((actor) => actor.averageScore !== null)
      .sort((left, right) => (right.averageScore ?? 0) - (left.averageScore ?? 0));

    return {
      actions,
      markets,
      actors,
      leaderboard,
      summaryStats: buildSummaryStats(markets, actions, actors),
      sourceError:
        failedActivityReads === 0
          ? null
          : `${failedActivityReads} market activity read${
              failedActivityReads === 1 ? "" : "s"
            } failed.`,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return emptySnapshot(error);
  }
}

export async function getActions(): Promise<ExplorerAction[]> {
  return (await getExplorerSnapshot()).actions;
}

export async function getAction(actionId: string): Promise<ExplorerAction | null> {
  const snapshot = await getExplorerSnapshot();
  const decodedActionId = decodePathValue(actionId);

  return (
    snapshot.actions.find(
      (action) =>
        action.id === actionId ||
        action.id === decodedActionId ||
        encodeURIComponent(action.id) === actionId,
    ) ?? null
  );
}

export async function getMarkets(): Promise<ExplorerMarket[]> {
  return (await getExplorerSnapshot()).markets;
}

export async function getMarket(marketId: string): Promise<ExplorerMarket | null> {
  const decodedMarketId = decodePathValue(marketId);
  const market = await getDreamdexMarket(decodedMarketId);

  if (!market) {
    return null;
  }

  const activity = await listDreamdexMarketActivity(market, ACTIVITY_LIMIT);
  const actions = await withPersistedScores(
    activity.map((item) => normalizeAction(item, market)),
  );

  return normalizeMarket(market, actions);
}

export async function getActors(): Promise<ExplorerActor[]> {
  return (await getExplorerSnapshot()).actors;
}

export async function getActor(actorId: string): Promise<ExplorerActor | null> {
  const snapshot = await getExplorerSnapshot();
  const decodedActorId = decodePathValue(actorId);

  return (
    snapshot.actors.find(
      (actor) =>
        actor.id === actorId ||
        actor.id === decodedActorId ||
        encodeURIComponent(actor.id) === actorId,
    ) ?? null
  );
}

export async function getLeaderboard(): Promise<ExplorerActor[]> {
  return (await getExplorerSnapshot()).leaderboard;
}

/** Merge persisted score rows into live actions; missing scores stay null. */
async function withPersistedScores(
  actions: ExplorerAction[],
): Promise<ExplorerAction[]> {
  const scores = await loadActionScores();

  if (scores.size === 0) {
    return actions;
  }

  return actions.map((action) => {
    const score = scores.get(action.id);

    return score
      ? { ...action, pnl: score.pnl, score: score.score }
      : action;
  });
}

function normalizeMarket(
  market: BinaryMarket,
  actionsList: ExplorerAction[],
): ExplorerMarket {
  const latestActionAt =
    actionsList[0]?.occurredAt ??
    timestampToIso(
      market.lastTradeAt ??
        market.resolvedAtTimestamp ??
        market.expiry ??
        market.tradingStart ??
        market.createdAtTimestamp,
    );

  return {
    id: market.id,
    symbol: marketLabel(market),
    actions: Math.max(toInteger(market.tradeCount), actionsList.length),
    settled: outcomeFromMarket(market) ? 1 : 0,
    riskFlags: actionsList.filter(hasRiskFlag).length,
    volume: roundNumber(toNumber(market.cumulativeQuoteVolume, market.quoteDecimals)),
    latestActionAt,
    status: market.status ?? "Indexed",
    actionsList,
  };
}

function normalizeAction(
  activity: MarketActivity,
  market: BinaryMarket,
): ExplorerAction {
  const actor = actorFromActivity(activity);
  const side = sideFromActivity(activity);

  return {
    id: activity.id,
    marketId: market.id,
    marketSymbol: marketLabel(market),
    actorId: actor.id,
    actorLabel: actor.label,
    actorType: actor.type,
    mode: "observed",
    actionType: actionTypeFromActivity(activity, side),
    side,
    price: priceFromActivity(activity, market),
    size: sizeFromActivity(activity, market),
    riskResult: "unchecked",
    txHash: activity.txHash,
    outcome: outcomeFromMarket(market),
    pnl: null,
    score: null,
    occurredAt: timestampToIso(activity.timestamp),
  };
}

function buildActors(actions: ExplorerAction[]): ExplorerActor[] {
  const actors = new Map<string, ExplorerActor>();

  for (const action of actions) {
    const current =
      actors.get(action.actorId) ??
      {
        id: action.actorId,
        label: action.actorLabel,
        type: action.actorType,
        actions: 0,
        scoredActions: 0,
        scoreTotal: 0,
        pnl: 0,
        riskFlags: 0,
        averageScore: null,
        actionsList: [],
      };

    current.actions += 1;
    current.pnl += action.pnl ?? 0;
    current.riskFlags += hasRiskFlag(action) ? 1 : 0;
    current.actionsList.push(action);

    if (action.score !== null) {
      current.scoredActions += 1;
      current.scoreTotal += action.score;
      current.averageScore = Math.round(current.scoreTotal / current.scoredActions);
    }

    actors.set(action.actorId, current);
  }

  return [...actors.values()].sort((left, right) => right.actions - left.actions);
}

function buildSummaryStats(
  markets: ExplorerMarket[],
  actions: ExplorerAction[],
  actors: ExplorerActor[],
) {
  const uncheckedActions = actions.filter(
    (action) => action.riskResult === "unchecked",
  ).length;

  return [
    {
      label: "Markets indexed",
      value: markets.length.toLocaleString(),
      detail: "Live DreamDEX binary markets from Somnia.",
    },
    {
      label: "Actions indexed",
      value: actions.length.toLocaleString(),
      detail: "Recent on-chain market events, not generated rows.",
    },
    {
      label: "Actors observed",
      value: actors.length.toLocaleString(),
      detail: "Wallets or protocol actors seen in activity.",
    },
    {
      label: "Checks pending",
      value: uncheckedActions.toLocaleString(),
      detail: "Observed actions awaiting pre-trade risk receipts.",
    },
  ];
}

function actorFromActivity(activity: MarketActivity): {
  id: string;
  label: string;
  type: ActorType;
} {
  if (activity.kind === "TRADE") {
    const actorId = activity.taker ?? activity.maker;

    if (actorId) {
      return {
        id: actorId,
        label: shortAddress(actorId),
        type: "wallet",
      };
    }

    return {
      id: `unknown:${activity.txHash}`,
      label: "Unknown actor",
      type: "unknown",
    };
  }

  if (
    activity.kind === "MINT_SET" ||
    activity.kind === "MERGE_SET" ||
    activity.kind === "REDEEM"
  ) {
    return {
      id: activity.account,
      label: shortAddress(activity.account),
      type: "wallet",
    };
  }

  return {
    id: "protocol",
    label: "Protocol",
    type: "protocol",
  };
}

function actionTypeFromActivity(
  activity: MarketActivity,
  side: "YES" | "NO" | null,
): ActionType {
  if (activity.kind === "TRADE") {
    const binarySide = activity.takerSide ?? activity.makerSide;

    if (binarySide === "BUY_YES") return "buy_yes";
    if (binarySide === "BUY_NO") return "buy_no";
    if (binarySide === "SELL_YES") return "sell_yes";
    if (binarySide === "SELL_NO") return "sell_no";

    return side ? "trade" : "trade";
  }

  if (activity.kind === "MINT_SET") return "mint_set";
  if (activity.kind === "MERGE_SET") return "merge_set";
  if (activity.kind === "REDEEM") return "redeem";
  if (activity.kind === "RESOLUTION") return "resolution";

  return "status";
}

function sideFromActivity(activity: MarketActivity): "YES" | "NO" | null {
  if (activity.kind !== "TRADE") {
    return null;
  }

  return sideFromBinarySide(activity.takerSide ?? activity.makerSide);
}

function sideFromBinarySide(side: BinarySide | null | undefined): "YES" | "NO" | null {
  if (!side) return null;
  if (side.endsWith("_YES")) return "YES";
  if (side.endsWith("_NO")) return "NO";

  return null;
}

function priceFromActivity(
  activity: MarketActivity,
  market: BinaryMarket,
): number | null {
  if (activity.kind !== "TRADE") {
    return null;
  }

  return roundNumber(toNumber(activity.fillPrice, market.quoteDecimals), 6);
}

function sizeFromActivity(
  activity: MarketActivity,
  market: BinaryMarket,
): number | null {
  if (activity.kind === "TRADE") {
    return roundNumber(toNumber(activity.quantity, market.baseDecimals), 6);
  }

  if (
    activity.kind === "MINT_SET" ||
    activity.kind === "MERGE_SET" ||
    activity.kind === "REDEEM"
  ) {
    return roundNumber(toNumber(activity.amount, market.baseDecimals), 6);
  }

  return null;
}

function outcomeFromMarket(market: BinaryMarket): MarketOutcome | null {
  if (market.voided) {
    return "VOID";
  }

  if (market.winningOutcome === 0) {
    return "YES";
  }

  if (market.winningOutcome === 1) {
    return "NO";
  }

  return null;
}

function hasRiskFlag(action: ExplorerAction): boolean {
  const flagged: RiskResult[] = ["risky", "blocked"];
  return flagged.includes(action.riskResult);
}

function marketLabel(market: BinaryMarket): string {
  if (market.question) {
    return market.question;
  }

  if (market.asset) {
    return `${market.asset} event market`;
  }

  return shortAddress(market.id);
}

function timestampToIso(timestamp: string | null | undefined): string {
  const seconds = Number(timestamp);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return EMPTY_DATE;
  }

  return new Date(seconds * 1000).toISOString();
}

function toInteger(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function toNumber(value: string | number | null | undefined, decimals = 0): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed / 10 ** decimals;
}

function roundNumber(value: number, digits = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(digits));
}

function shortAddress(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function decodePathValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function emptySnapshot(error: unknown): ExplorerSnapshot {
  return {
    actions: [],
    markets: [],
    actors: [],
    leaderboard: [],
    summaryStats: buildSummaryStats([], [], []),
    sourceError:
      error instanceof Error
        ? error.message
        : "DreamDEX indexer data could not be loaded.",
    fetchedAt: new Date().toISOString(),
  };
}
