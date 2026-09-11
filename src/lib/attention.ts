import type { BinaryMarket, MarketActivity } from "@somnia-chain/markets-sdk";

import { listDreamdexMarkets, listDreamdexMarketActivity } from "./dreamdex";
import { config } from "./config";

export type TapeCell = {
  side: "buy" | "sell";
  qty: number;
  size: "small" | "mid" | "big";
  price: number | null;
  at: string;
  agoMinutes: number;
};

export type AttentionAxes = {
  buy: number;
  vol: number;
  flow: number;
  crowd: number;
  size: number;
  fresh: number;
};

export type HotMarket = {
  id: string;
  question: string;
  asset: string;
  trades: number;
  buys: number;
  sells: number;
  buyPct: number;
  sellPct: number;
  uniqueActors: number;
  lastTradeMinutesAgo: number;
  attention: number;
  axes: AttentionAxes;
  summary: string;
  tape: TapeCell[];
};

const HOT_CANDIDATES = config.hotCandidates;
const TAPE_LIMIT = config.activityLimit;

function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(clamp(value));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

function sideOf(activity: MarketActivity): "buy" | "sell" | null {
  if (activity.kind !== "TRADE") return null;
  const side = activity.takerSide ?? activity.makerSide;
  if (!side) return null;
  if (side.startsWith("BUY")) return "buy";
  if (side.startsWith("SELL")) return "sell";
  return null;
}

function actorOf(activity: MarketActivity): string | null {
  if (activity.kind !== "TRADE") return null;
  return activity.taker ?? activity.maker ?? null;
}

/**
 * Build the attention profile for one market from its observed trade window.
 * Every number is a deterministic heuristic over real fills — no invented data.
 */
export function computeAttention(
  market: Pick<BinaryMarket, "id" | "question" | "asset" | "baseDecimals" | "quoteDecimals">,
  activity: MarketActivity[],
): HotMarket | null {
  const trades = activity.filter((item) => item.kind === "TRADE");

  if (trades.length < config.attention.minTrades) {
    return null;
  }

  const nowSeconds = Date.now() / 1000;
  const base = market.baseDecimals ?? 0;
  const quote = market.quoteDecimals ?? 0;

  let buys = 0;
  let sells = 0;
  const timestamps: number[] = [];
  const quantities: number[] = [];
  const tape: TapeCell[] = [];
  const actors = new Set<string>();

  for (const trade of trades) {
    const side = sideOf(trade);
    if (!side) continue;

    const seconds = Number(trade.timestamp);
    if (!Number.isFinite(seconds) || seconds <= 0) continue;

    const qty = (Number(trade.quantity) || 0) / 10 ** base;
    const price = (Number(trade.fillPrice) || 0) / 10 ** quote;

    if (side === "buy") buys += 1;
    else sells += 1;

    timestamps.push(seconds);
    quantities.push(qty);
    if (actorOf(trade)) actors.add(actorOf(trade)!);

    const agoMinutes = Math.max(0, Math.round((nowSeconds - seconds) / 60));
    const p50 = percentile(quantities, 50);
    const p80 = percentile(quantities, 80);
    tape.push({
      side,
      qty,
      size: qty >= p80 ? "big" : qty >= p50 ? "mid" : "small",
      price: price > 0 ? price : null,
      at: new Date(seconds * 1000).toISOString(),
      agoMinutes,
    });
  }

  if (timestamps.length < config.attention.minTrades) {
    return null;
  }

  tape.reverse(); // oldest first so newest render bottom-right

  const total = buys + sells;
  const buyPct = round((buys / total) * 100);
  const sellPct = 100 - buyPct;

  const newest = Math.max(...timestamps);
  const oldest = Math.min(...timestamps);
  const lastTradeMinutesAgo = Math.max(0, Math.round((nowSeconds - newest) / 60));

  // Volume acceleration: trades in the last 6h vs the prior 6h window.
  const recent = timestamps.filter((ts) => ts > nowSeconds - 6 * 3600).length;
  const prior = timestamps.filter(
    (ts) => ts <= nowSeconds - 6 * 3600 && ts > nowSeconds - 12 * 3600,
  ).length;
  const accel = recent / Math.max(1, prior);
  const vol = prior === 0 ? (recent > 0 ? 100 : 0) : round(accel * 33);

  // Flow: trades per hour across the observed span (span floor 30m).
  const spanHours = Math.max(0.5, (nowSeconds - oldest) / 3600);
  const tradesPerHour = timestamps.length / spanHours;
  const flow = round((tradesPerHour / config.attention.flowSaturation) * 100);

  // Crowd: distinct actors (9 actors ≈ saturated).
  const crowd = round((actors.size / config.attention.crowdSaturation) * 100);

  // Size: median trade vs the p90 trade in the same window (relative fatness).
  const med = median(quantities);
  const p90 = percentile(quantities, 90);
  const size = p90 > 0 ? round((med / p90) * 100) : 0;

  // Fresh: full score under 30m, decays to 0 at 24h.
  const fresh = round(100 - Math.max(0, lastTradeMinutesAgo - 30) * (100 / 1410));

  const attention = round(
    0.26 * flow + 0.2 * crowd + 0.2 * vol + 0.18 * fresh + 0.16 * size,
  );

  const axes: AttentionAxes = { buy: buyPct, vol, flow, crowd, size, fresh };

  const labels: Record<keyof AttentionAxes, string> = {
    buy: "buy pressure",
    vol: "volume acceleration",
    flow: "trade flow",
    crowd: "crowd width",
    size: "trade size",
    fresh: "freshness",
  };
  const entries = Object.entries(axes) as [keyof AttentionAxes, number][];
  const strong = entries.filter(([, value]) => value >= 60).map(([key]) => labels[key]);
  const thin = entries.filter(([, value]) => value < 35).map(([key]) => labels[key]);

  let summary = "Mixed attention signals across the observed window.";
  if (strong.length > 0 && thin.length > 0) {
    summary = `Strong on ${strong.slice(0, 3).join(", ")}. Thin on ${thin.slice(0, 2).join(", ")}.`;
  } else if (strong.length > 0) {
    summary = `Strong on ${strong.slice(0, 3).join(", ")}.`;
  } else if (thin.length > 0) {
    summary = `Thin on ${thin.slice(0, 3).join(", ")}.`;
  }

  return {
    id: market.id,
    question: market.question ?? market.id,
    asset: assetOf(market.question ?? ""),
    trades: timestamps.length,
    buys,
    sells,
    buyPct,
    sellPct,
    uniqueActors: actors.size,
    lastTradeMinutesAgo,
    attention,
    axes,
    summary,
    tape,
  };
}

export function assetOf(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.includes("BTC") || upper.includes("BITCOIN")) return "BTC";
  if (upper.includes("ETH") || upper.includes("ETHEREUM")) return "ETH";
  if (upper.includes("SOL") || upper.includes("SOLANA")) return "SOL";
  return "";
}

/** Rank the hottest markets right now from live reads. */
export async function getHotMarkets(limit = config.hotLimitDefault): Promise<HotMarket[]> {
  const markets = await listDreamdexMarkets(50);
  const targets = markets
    .filter((market) => Number(market.tradeCount) > 0)
    .sort((left, right) => Number(right.tradeCount) - Number(left.tradeCount))
    .slice(0, HOT_CANDIDATES);

  const results = await Promise.allSettled(
    targets.map(async (market) => ({
      market,
      activity: await listDreamdexMarketActivity(market, TAPE_LIMIT),
    })),
  );

  const hot = results
    .filter(
      (result): result is PromiseFulfilledResult<{ market: BinaryMarket; activity: MarketActivity[] }> =>
        result.status === "fulfilled",
    )
    .map((result) => computeAttention(result.value.market, result.value.activity))
    .filter((item): item is HotMarket => item !== null)
    .sort((left, right) => right.attention - left.attention);

  return hot.slice(0, limit);
}

/** Full attention profile for one market (analysis page). */
export async function getMarketAttention(
  market: BinaryMarket,
): Promise<HotMarket | null> {
  const activity = await listDreamdexMarketActivity(market, TAPE_LIMIT);
  return computeAttention(market, activity);
}

/** Resolve one market by id, for the analysis page. */
export async function getDreamdexMarketForAttention(
  marketId: string,
): Promise<BinaryMarket | null> {
  const { getDreamdexMarket } = await import("./dreamdex");
  return getDreamdexMarket(decodeURIComponent(marketId));
}
