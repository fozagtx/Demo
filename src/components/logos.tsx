export function ScreenpadMark({ size = 28 }: { size?: number }) {
  // Pixel monitor with chart bars — the Screenpad mark.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-label="Screenpad logo"
    >
      {/* monitor frame */}
      <rect x="0" y="1" width="16" height="12" fill="#f4f4f4" />
      <rect x="1" y="2" width="14" height="10" fill="#1a1c2c" />
      {/* chart bars */}
      <rect x="3" y="9" width="2" height="2" fill="#38b764" />
      <rect x="6" y="7" width="2" height="4" fill="#38b764" />
      <rect x="9" y="5" width="2" height="6" fill="#41a6f6" />
      <rect x="12" y="3" width="1" height="8" fill="#ffcd75" />
      {/* stand */}
      <rect x="6" y="13" width="4" height="1" fill="#f4f4f4" />
      <rect x="5" y="14" width="6" height="1" fill="#f4f4f4" />
    </svg>
  );
}

/** Somnia "S" block mark — simplified pixel S, brand-adjacent. */
export function SomniaMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-label="Somnia"
    >
      <rect x="2" y="0" width="8" height="2" fill="#7b8cde" />
      <rect x="0" y="2" width="4" height="2" fill="#7b8cde" />
      <rect x="4" y="4" width="4" height="2" fill="#7b8cde" />
      <rect x="8" y="6" width="4" height="2" fill="#7b8cde" />
      <rect x="2" y="8" width="8" height="2" fill="#7b8cde" />
    </svg>
  );
}

/** 12x12 pixel asset glyphs. */
const ASSET_COLORS: Record<string, { fg: string; bg: string; glyph: string[] }> = {
  BTC: {
    fg: "#ffffff",
    bg: "#f7931a",
    glyph: ["....####....", "..##....##..", ".##..##..##.", "#...######..", "#..##....##.", "....####....", "....####....", ".##......##.", "..########.."],
  },
  ETH: {
    fg: "#ffffff",
    bg: "#627eea",
    glyph: [".....##.....", "....####....", "...##..##...", "..########..", "..########..", "...##..##...", "....####....", ".....##.....", "............"],
  },
  SOL: {
    fg: "#10121f",
    bg: "#14f195",
    glyph: ["............", ".##########.", "....####....", "..########..", "....####....", ".##########.", "............", "............", "............"],
  },
  DEFAULT: {
    fg: "#94b0c2",
    bg: "#333c57",
    glyph: ["............", "..########..", ".##......##.", ".##......##.", ".##......##.", ".##......##.", "..########..", "............", "............"],
  },
};

export function AssetMark({ symbol, size = 14 }: { symbol: string; size?: number }) {
  const key = Object.keys(ASSET_COLORS).find((asset) =>
    symbol.toUpperCase().includes(asset),
  );
  const asset = ASSET_COLORS[key ?? "DEFAULT"];
  const rows = asset.glyph;
  const unit = size / 12;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-label={key ?? "market"}
      className="inline-block shrink-0"
    >
      <rect x="0" y="0" width="12" height="12" fill={asset.bg} />
      {rows.map((row, y) =>
        [...row].map((cell, x) =>
          cell === "#" ? (
            <rect key={`${x}-${y}`} x={x * unit} y={y * unit} width={unit + 0.02} height={unit + 0.02} fill={asset.fg} />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Extract a tradable asset symbol from a market question. */
export function assetFromSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.includes("BTC") || upper.includes("BITCOIN")) return "BTC";
  if (upper.includes("ETH") || upper.includes("ETHEREUM")) return "ETH";
  if (upper.includes("SOL") || upper.includes("SOLANA")) return "SOL";
  return "";
}
