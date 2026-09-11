export type ActorType =
  | "wallet"
  | "agent"
  | "market_maker"
  | "vault"
  | "copy_trader"
  | "app"
  | "game"
  | "protocol"
  | "unknown";

export type ActionMode = "observed" | "receipt";

export type ActionType =
  | "buy_yes"
  | "buy_no"
  | "sell_yes"
  | "sell_no"
  | "trade"
  | "mint_set"
  | "merge_set"
  | "redeem"
  | "resolution"
  | "status"
  | "watch"
  | "block";

export type RiskResult = "safe" | "risky" | "blocked" | "watch" | "unchecked";

export type MarketOutcome = "YES" | "NO" | "VOID";

export type ExplorerAction = {
  id: string;
  marketId: string;
  marketSymbol: string;
  actorId: string;
  actorLabel: string;
  actorType: ActorType;
  mode: ActionMode;
  actionType: ActionType;
  side: "YES" | "NO" | null;
  price: number | null;
  size: number | null;
  riskResult: RiskResult;
  txHash: string | null;
  outcome: MarketOutcome | null;
  pnl: number | null;
  score: number | null;
  occurredAt: string;
};

export type ExplorerMarket = {
  id: string;
  symbol: string;
  actions: number;
  settled: number;
  riskFlags: number;
  volume: number;
  latestActionAt: string;
  status: string;
  actionsList: ExplorerAction[];
};

export type ExplorerActor = {
  id: string;
  label: string;
  type: ActorType;
  actions: number;
  scoredActions: number;
  scoreTotal: number;
  pnl: number;
  riskFlags: number;
  averageScore: number | null;
  actionsList: ExplorerAction[];
};

export type ExplorerSummaryStat = {
  label: string;
  value: string;
  detail: string;
};

export type ExplorerSnapshot = {
  actions: ExplorerAction[];
  markets: ExplorerMarket[];
  actors: ExplorerActor[];
  leaderboard: ExplorerActor[];
  summaryStats: ExplorerSummaryStat[];
  sourceError: string | null;
  fetchedAt: string;
};
