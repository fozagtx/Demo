/**
 * Persistence layer for workers.
 *
 * Design rules:
 * - Never invent data. Only rows read from the DreamDEX indexer are persisted.
 * - DATABASE_URL is optional at import time. If missing, every helper reports
 *   `dbEnabled: false` and the workers log that state instead of crashing.
 * - Idempotent batched upserts so re-running a watcher never duplicates rows
 *   and never makes one round-trip per row against a remote database.
 */

import { sql } from "drizzle-orm";

import { closeDb } from "./db";
import { hashReceipt } from "./receipts";
import * as schema from "./schema";
import type {
  ExplorerAction,
  ExplorerMarket,
  MarketOutcome,
} from "./types";

export type PersistResult<T> =
  | { dbEnabled: true; ok: true; data: T }
  | { dbEnabled: true; ok: false; error: string }
  | { dbEnabled: false; ok: false; data: null };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not set; refusing to persist. Workers still ran against live SDK data.",
    );
  }

  const { db } = await import("./db");
  return db;
}

const CHUNK_SIZE = 100;

function chunk<T>(items: T[]): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += CHUNK_SIZE) {
    chunks.push(items.slice(index, index + CHUNK_SIZE));
  }

  return chunks;
}

function errorResult(error: unknown): {
  dbEnabled: true;
  ok: false;
  error: string;
} {
  return {
    dbEnabled: true,
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

export async function upsertMarkets(
  markets: ExplorerMarket[],
): Promise<PersistResult<number>> {
  if (!isDatabaseConfigured()) {
    return { dbEnabled: false, ok: false, data: null };
  }

  try {
    const db = await requireDb();
    let upserted = 0;

    for (const batch of chunk(markets)) {
      await db
        .insert(schema.markets)
        .values(
          batch.map((market) => ({
            id: market.id,
            symbol: market.symbol,
            status: market.status,
            updatedAt: new Date(),
          })),
        )
        .onConflictDoUpdate({
          target: schema.markets.id,
          set: {
            symbol: sql`excluded.symbol`,
            status: sql`excluded.status`,
            updatedAt: sql`now()`,
          },
        });
      upserted += batch.length;
    }

    return { dbEnabled: true, ok: true, data: upserted };
  } catch (error) {
    return errorResult(error);
  }
}

export async function upsertActors(
  actions: ExplorerAction[],
): Promise<PersistResult<number>> {
  if (!isDatabaseConfigured()) {
    return { dbEnabled: false, ok: false, data: null };
  }

  try {
    const db = await requireDb();
    const actors = new Map<string, ExplorerAction["actorId"]>();

    for (const action of actions) {
      actors.set(action.actorId, action.actorId);
    }

    // Actor metadata comes from the action rows themselves; dedupe by id.
    const actorRows = [...actors.keys()].map((actorId) => {
      const source = actions.find((action) => action.actorId === actorId)!;
      return {
        id: source.actorId,
        address: source.actorId.startsWith("0x") ? source.actorId : null,
        displayName: source.actorLabel,
        type: source.actorType,
      };
    });

    if (actorRows.length === 0) {
      return { dbEnabled: true, ok: true, data: 0 };
    }

    for (const batch of chunk(actorRows)) {
      await db
        .insert(schema.actors)
        .values(batch)
        .onConflictDoUpdate({
          target: schema.actors.id,
          set: {
            displayName: sql`excluded.display_name`,
            type: sql`excluded.type`,
          },
        });
    }

    return { dbEnabled: true, ok: true, data: actorRows.length };
  } catch (error) {
    return errorResult(error);
  }
}

export async function upsertActions(
  actions: ExplorerAction[],
): Promise<PersistResult<number>> {
  if (!isDatabaseConfigured()) {
    return { dbEnabled: false, ok: false, data: null };
  }

  try {
    const db = await requireDb();
    let upserted = 0;

    for (const batch of chunk(actions)) {
      await db
        .insert(schema.actions)
        .values(
          batch.map((action) => ({
            id: action.id,
            marketId: action.marketId,
            actorId: action.actorId,
            mode: action.mode,
            actionType: action.actionType,
            side: action.side,
            observedPrice: action.price === null ? null : String(action.price),
            observedSize: action.size === null ? null : String(action.size),
            txHash: action.txHash,
            raw: action,
            occurredAt: new Date(action.occurredAt),
          })),
        )
        .onConflictDoUpdate({
          target: schema.actions.id,
          set: {
            actionType: sql`excluded.action_type`,
            side: sql`excluded.side`,
            observedPrice: sql`excluded.observed_price`,
            observedSize: sql`excluded.observed_size`,
          },
        });
      upserted += batch.length;
    }

    return { dbEnabled: true, ok: true, data: upserted };
  } catch (error) {
    return errorResult(error);
  }
}

export type SettlementUpsert = {
  marketId: string;
  outcome: MarketOutcome;
  settledAt: string;
  txHash: string | null;
};

export async function upsertSettlement(
  settlement: SettlementUpsert,
): Promise<PersistResult<boolean>> {
  if (!isDatabaseConfigured()) {
    return { dbEnabled: false, ok: false, data: null };
  }

  try {
    const db = await requireDb();

    await db
      .insert(schema.settlements)
      .values({
        id: `${settlement.marketId}:${settlement.outcome}`,
        marketId: settlement.marketId,
        outcome: settlement.outcome,
        settledAt: new Date(settlement.settledAt),
        txHash: settlement.txHash,
      })
      .onConflictDoUpdate({
        target: schema.settlements.id,
        set: {
          outcome: sql`excluded.outcome`,
          settledAt: sql`excluded.settled_at`,
          txHash: sql`excluded.tx_hash`,
        },
      });

    await db
      .update(schema.markets)
      .set({ settledAt: new Date(settlement.settledAt), outcome: settlement.outcome })
      .where(sql`${schema.markets.id} = ${settlement.marketId}`);

    return { dbEnabled: true, ok: true, data: true };
  } catch (error) {
    return errorResult(error);
  }
}

export type ScoreUpsert = {
  actionId: string;
  actorId: string;
  marketId: string;
  correct: boolean | null;
  pnl: number | null;
  brierScore: number | null;
  riskAdjustedScore: number | null;
  receiptPayload: unknown;
};

export async function recordScores(
  scores: ScoreUpsert[],
): Promise<PersistResult<number>> {
  if (!isDatabaseConfigured()) {
    return { dbEnabled: false, ok: false, data: null };
  }

  try {
    const db = await requireDb();
    let upserted = 0;

    for (const batch of chunk(scores)) {
      await db
        .insert(schema.scores)
        .values(
          batch.map((score) => ({
            id: score.actionId,
            actionId: score.actionId,
            actorId: score.actorId,
            marketId: score.marketId,
            correct: score.correct,
            pnl: score.pnl === null ? null : String(score.pnl),
            brierScore: score.brierScore === null ? null : String(score.brierScore),
            riskAdjustedScore:
              score.riskAdjustedScore === null
                ? null
                : String(score.riskAdjustedScore),
            notes: { receiptHash: hashReceipt(score.receiptPayload) },
          })),
        )
        .onConflictDoUpdate({
          target: schema.scores.id,
          set: {
            correct: sql`excluded.correct`,
            pnl: sql`excluded.pnl`,
            brierScore: sql`excluded.brier_score`,
            riskAdjustedScore: sql`excluded.risk_adjusted_score`,
            notes: sql`excluded.notes`,
          },
        });
      upserted += batch.length;
    }

    return { dbEnabled: true, ok: true, data: upserted };
  } catch (error) {
    return errorResult(error);
  }
}

export type ActionScoreLookup = {
  pnl: number | null;
  score: number | null;
  correct: boolean | null;
};

/**
 * Load persisted scores keyed by action id so server pages can enrich the
 * live snapshot with real scoring results. Returns an empty map when the DB
 * is not configured or unreadable — the UI then shows unscored, which is
 * the honest state.
 */
export async function loadActionScores(): Promise<
  Map<string, ActionScoreLookup>
> {
  if (!isDatabaseConfigured()) {
    return new Map();
  }

  try {
    const db = await requireDb();
    const rows = await db
      .select({
        actionId: schema.scores.actionId,
        pnl: schema.scores.pnl,
        riskAdjustedScore: schema.scores.riskAdjustedScore,
        correct: schema.scores.correct,
      })
      .from(schema.scores);

    return new Map(
      rows.map((row) => [
        row.actionId,
        {
          pnl: row.pnl === null ? null : Number(row.pnl),
          score:
            row.riskAdjustedScore === null
              ? null
              : Number(row.riskAdjustedScore),
          correct: row.correct,
        },
      ]),
    );
  } catch {
    return new Map();
  }
}

export { closeDb };
