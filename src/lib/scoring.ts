import type { MarketOutcome } from "./types";

export type ScoreInput = {
  side: "YES" | "NO" | null;
  outcome: MarketOutcome | null;
  fillPrice: number | null;
  size: number | null;
  predictedProbability?: number | null;
  riskWasSafe: boolean;
};

export function scoreAction(input: ScoreInput) {
  if (!input.side || !input.outcome || input.outcome === "VOID") {
    return {
      correct: null,
      pnl: null,
      brierScore: null,
      riskAdjustedScore: null,
    };
  }

  const correct = input.side === input.outcome;
  const fillPrice = input.fillPrice ?? 0;
  const size = input.size ?? 0;
  const payoutPerShare = correct ? 1 : 0;
  const pnl = (payoutPerShare - fillPrice) * size;
  const actual = input.outcome === "YES" ? 1 : 0;
  const brierScore =
    input.predictedProbability === null || input.predictedProbability === undefined
      ? null
      : Math.pow(input.predictedProbability - actual, 2);
  const base = correct ? 70 : 30;
  const riskPenalty = input.riskWasSafe ? 0 : 15;
  const riskAdjustedScore = Math.max(0, Math.min(100, base - riskPenalty + pnl));

  return {
    correct,
    pnl,
    brierScore,
    riskAdjustedScore,
  };
}
