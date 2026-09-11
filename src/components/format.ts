/** Display-only formatting helpers. Internal math keeps raw precision. */

export function formatSigned(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  if (value === 0) {
    return "0.00";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

export function formatAmount(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  const abs = Math.abs(value);

  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (abs > 0 && abs < 0.0001) return "<0.0001";

  return value.toFixed(digits).replace(/\.?0+$/, "") || "0";
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  return value.toFixed(6).replace(/\.?0+$/, "");
}
