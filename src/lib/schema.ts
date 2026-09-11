import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const markets = pgTable("markets", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull(),
  poolAddress: text("pool_address"),
  baseAsset: text("base_asset"),
  quoteAsset: text("quote_asset"),
  status: text("status").notNull().default("unknown"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  outcome: text("outcome"),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const actors = pgTable("actors", {
  id: text("id").primaryKey(),
  address: text("address"),
  displayName: text("display_name"),
  type: text("type").notNull().default("unknown"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const actions = pgTable(
  "actions",
  {
    id: text("id").primaryKey(),
    marketId: text("market_id").notNull().references(() => markets.id),
    actorId: text("actor_id").notNull().references(() => actors.id),
    mode: text("mode").notNull(),
    actionType: text("action_type").notNull(),
    side: text("side"),
    intendedPrice: numeric("intended_price"),
    intendedSize: numeric("intended_size"),
    observedPrice: numeric("observed_price"),
    observedSize: numeric("observed_size"),
    txHash: text("tx_hash"),
    blockNumber: integer("block_number"),
    decisionReason: text("decision_reason"),
    snapshotHash: text("snapshot_hash"),
    receiptHash: text("receipt_hash"),
    raw: jsonb("raw"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("actions_market_idx").on(table.marketId),
    index("actions_actor_idx").on(table.actorId),
    index("actions_tx_idx").on(table.txHash),
  ],
);

export const riskChecks = pgTable("risk_checks", {
  id: text("id").primaryKey(),
  actionId: text("action_id").notNull().references(() => actions.id),
  marketActive: boolean("market_active").notNull(),
  timeLeftOk: boolean("time_left_ok").notNull(),
  liquidityOk: boolean("liquidity_ok").notNull(),
  spreadOk: boolean("spread_ok").notNull(),
  slippageOk: boolean("slippage_ok").notNull(),
  sizeOk: boolean("size_ok").notNull(),
  budgetOk: boolean("budget_ok").notNull(),
  result: text("result").notNull(),
  reasons: jsonb("reasons").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settlements = pgTable("settlements", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull().references(() => markets.id),
  outcome: text("outcome").notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }).notNull(),
  txHash: text("tx_hash"),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scores = pgTable("scores", {
  id: text("id").primaryKey(),
  actionId: text("action_id").notNull().references(() => actions.id),
  actorId: text("actor_id").notNull().references(() => actors.id),
  marketId: text("market_id").notNull().references(() => markets.id),
  correct: boolean("correct"),
  pnl: numeric("pnl"),
  brierScore: numeric("brier_score"),
  fillQuality: text("fill_quality"),
  riskAdjustedScore: numeric("risk_adjusted_score"),
  notes: jsonb("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
