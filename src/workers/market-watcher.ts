import "dotenv/config";
import pino from "pino";

import { getExplorerSnapshot } from "@/lib/explorer";
import {
  closeDb,
  isDatabaseConfigured,
  upsertActions,
  upsertActors,
  upsertMarkets,
} from "@/lib/persist";
import type { PersistResult } from "@/lib/persist";

const logger = pino({ name: "market-watcher" });

function logPersistFailure(stage: string, result: PersistResult<unknown>) {
  logger.error(
    { error: "error" in result ? result.error : "unknown error" },
    `${stage} failed`,
  );
}

async function main() {
  logger.info("Starting DreamDEX market watcher (live SDK reads)");

  const snapshot = await getExplorerSnapshot();

  if (snapshot.sourceError) {
    logger.warn({ sourceError: snapshot.sourceError }, "Snapshot incomplete");
  }

  logger.info(
    { fetchedAt: snapshot.fetchedAt },
    `Fetched ${snapshot.markets.length} markets, ${snapshot.actions.length} actions, ${snapshot.actors.length} actors from live indexer`,
  );

  if (snapshot.markets.length === 0) {
    logger.warn("Indexer returned no markets; nothing to persist");
    return;
  }

  if (!isDatabaseConfigured()) {
    logger.info("DATABASE_URL not set; skipping persistence (live reads only)");
    return;
  }

  try {
    const marketsResult = await upsertMarkets(snapshot.markets);

    if (!marketsResult.ok) {
      logPersistFailure("Market upsert", marketsResult);
      process.exitCode = 1;
      return;
    }

    logger.info({ count: marketsResult.data }, "Markets upserted");

    const actorsResult = await upsertActors(snapshot.actions);

    if (!actorsResult.ok) {
      logPersistFailure("Actor upsert", actorsResult);
      process.exitCode = 1;
      return;
    }

    logger.info({ count: actorsResult.data }, "Actors upserted");

    const actionsResult = await upsertActions(snapshot.actions);

    if (!actionsResult.ok) {
      logPersistFailure("Action upsert", actionsResult);
      process.exitCode = 1;
      return;
    }

    logger.info({ count: actionsResult.data }, "Observed actions upserted");
  } finally {
    await closeDb();
  }
}

main().catch((error: unknown) => {
  logger.error({ error }, "Market watcher failed");
  process.exitCode = 1;
});
