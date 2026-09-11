import "dotenv/config";
import pino from "pino";

import { listDreamdexMarkets } from "@/lib/dreamdex";
import {
  closeDb,
  isDatabaseConfigured,
  upsertSettlement,
  type SettlementUpsert,
} from "@/lib/persist";
import type { MarketOutcome } from "@/lib/types";

const logger = pino({ name: "settlement-watcher" });

function outcomeOf(market: {
  voided?: boolean | null;
  winningOutcome?: number | null;
}): MarketOutcome | null {
  if (market.voided) {
    return "VOID";
  }

  // Binary markets: winningOutcome is an index into [YES, NO].
  if (market.winningOutcome === 0) return "YES";
  if (market.winningOutcome === 1) return "NO";

  return null;
}

function settledAtOf(market: {
  resolvedAtTimestamp: string | null | undefined;
}): string {
  const seconds = Number(market.resolvedAtTimestamp);
  return Number.isFinite(seconds) && seconds > 0
    ? new Date(seconds * 1000).toISOString()
    : new Date().toISOString();
}

async function main() {
  logger.info("Starting DreamDEX settlement watcher (live SDK reads)");

  const markets = await listDreamdexMarkets(50);
  const resolved = markets.filter((market) => outcomeOf(market) !== null);

  logger.info(
    { total: markets.length, resolved: resolved.length },
    "Fetched live markets",
  );

  if (resolved.length === 0) {
    logger.info("No resolved markets found; nothing to do");
    return;
  }

  if (!isDatabaseConfigured()) {
    logger.info("DATABASE_URL not set; skipping persistence (live reads only)");
    return;
  }

  try {
    const settlements: SettlementUpsert[] = resolved.flatMap((market) => {
      const outcome = outcomeOf(market);

      if (!outcome) {
        return [];
      }

      return [
        {
          marketId: market.id,
          outcome,
          settledAt: settledAtOf(market),
          txHash: null,
        },
      ];
    });

    let persisted = 0;

    for (const settlement of settlements) {
      const result = await upsertSettlement(settlement);

      if (result.ok) {
        persisted += 1;
      } else {
        logger.error(
          { error: "error" in result ? result.error : "unknown", marketId: settlement.marketId },
          "Settlement upsert failed",
        );
      }
  }

    logger.info({ persisted }, "Settlements persisted");

    if (persisted > 0) {
      logger.info("Run `pnpm worker:scores` to score actions for settled markets");
    }
  } finally {
    await closeDb();
  }
}

main().catch((error: unknown) => {
  logger.error({ error }, "Settlement watcher failed");
  process.exitCode = 1;
});
