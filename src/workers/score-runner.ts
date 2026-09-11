import "dotenv/config";
import pino from "pino";

import { getActions } from "@/lib/explorer";
import { closeDb, isDatabaseConfigured, recordScores, type ScoreUpsert } from "@/lib/persist";
import { scoreAction } from "@/lib/scoring";

const logger = pino({ name: "score-runner" });

async function main() {
  logger.info("Fetching live DreamDEX actions");

  const actions = await getActions();

  const scoreable = actions.filter(
    (action) =>
      action.side !== null &&
      action.outcome !== null &&
      action.outcome !== "VOID" &&
      action.price !== null &&
      action.size !== null,
  );

  logger.info(
    { totalActions: actions.length, scoreableActions: scoreable.length },
    "Loaded live actions",
  );

  if (scoreable.length === 0) {
    logger.info("No settled, scoreable actions in the current live window; nothing to do");
    return;
  }

  const scores: ScoreUpsert[] = [];

  for (const action of scoreable) {
    const result = scoreAction({
      side: action.side,
      outcome: action.outcome,
      fillPrice: action.price,
      size: action.size,
      riskWasSafe: action.riskResult === "safe",
    });

    scores.push({
      actionId: action.id,
      actorId: action.actorId,
      marketId: action.marketId,
      correct: result.correct,
      pnl: result.pnl,
      brierScore: result.brierScore,
      riskAdjustedScore: result.riskAdjustedScore,
      receiptPayload: {
        source: "dreamdex-live",
        actionId: action.id,
        marketId: action.marketId,
        actorId: action.actorId,
        side: action.side,
        fillPrice: action.price,
        size: action.size,
        outcome: action.outcome,
        occurredAt: action.occurredAt,
      },
    });
  }

  if (!isDatabaseConfigured()) {
    logger.info("DATABASE_URL not set; scored in memory only, not persisting");
    return;
  }

  try {
    const result = await recordScores(scores);

    if (!result.ok) {
      logger.error(
        { error: "error" in result ? result.error : "unknown" },
        "Score persist failed",
      );
      process.exitCode = 1;
      return;
    }

    logger.info({ persisted: result.data }, "Score run complete");
  } finally {
    await closeDb();
  }
}

main().catch((error: unknown) => {
  logger.error({ error }, "Score runner failed");
  process.exitCode = 1;
});
