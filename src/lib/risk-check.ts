import type { RiskResult } from "./types";

export type RiskCheckInput = {
  marketActive: boolean;
  timeToExpirySeconds: number;
  availableLiquidity: number;
  intendedSize: number;
  spread: number | null;
  maxSlippage: number;
  remainingBudget: number;
};

export type RiskCheckResult = {
  result: RiskResult;
  checks: {
    marketActive: boolean;
    timeLeftOk: boolean;
    liquidityOk: boolean;
    spreadOk: boolean;
    slippageOk: boolean;
    sizeOk: boolean;
    budgetOk: boolean;
  };
  reasons: string[];
  snapshot: RiskCheckInput;
};

export function runRiskCheck(input: RiskCheckInput): RiskCheckResult {
  const checks = {
    marketActive: input.marketActive,
    timeLeftOk: input.timeToExpirySeconds >= 30,
    liquidityOk: input.availableLiquidity >= input.intendedSize,
    spreadOk: input.spread !== null && input.spread <= 0.08,
    slippageOk: input.maxSlippage <= 0.03,
    sizeOk: input.intendedSize > 0,
    budgetOk: input.intendedSize <= input.remainingBudget,
  };

  const reasons = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return {
    result: reasons.length === 0 ? "safe" : "blocked",
    checks,
    reasons,
    snapshot: input,
  };
}
