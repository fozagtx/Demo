"use client";

export type TapeCellView = {
  side: "buy" | "sell";
  qty: number;
  size: "small" | "mid" | "big";
  price: number | null;
  agoMinutes: number;
};

function cellBuyPct(cells: TapeCellView[]): number {
  if (cells.length === 0) return 0;
  const buys = cells.filter((cell) => cell.side === "buy").length;
  return Math.round((buys / cells.length) * 100);
}

/** Every square = one trade, oldest top-left → newest bottom-right. */
export function TradeTape({ cells }: { cells: TapeCellView[] }) {
  if (cells.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border-2 border-dashed border-line">
        <p className="font-pixel text-[9px] text-faint">[ NO TRADES IN WINDOW ]</p>
      </div>
    );
  }

  const buyPct = cellBuyPct(cells);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
        <p className="font-pixel text-[8px] uppercase text-faint">
          every square = one trade · newest bottom-right
        </p>
        <div className="flex items-center gap-3 font-crt text-base">
          <span className="text-faint">SMALL</span>
          <span className="flex gap-0.5">
            <i className="h-2.5 w-2.5 bg-up/30" />
            <i className="h-2.5 w-2.5 bg-up/60" />
            <i className="h-2.5 w-2.5 bg-up" />
          </span>
          <span className="text-faint">BIG</span>
          <span className="text-up">■ BUY</span>
          <span className="text-down">■ SELL</span>
        </div>
      </div>

      <div
        className="grid gap-px bg-line/40 p-px"
        style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            title={`${cell.side.toUpperCase()} ${cell.qty.toFixed(2)} @ ${cell.price?.toFixed(3) ?? "—"} · ${cell.agoMinutes}m ago`}
            className={`aspect-square ${
              cell.side === "buy"
                ? cell.size === "big"
                  ? "bg-up"
                  : cell.size === "mid"
                    ? "bg-up/60"
                    : "bg-up/30"
                : cell.size === "big"
                  ? "bg-down"
                  : cell.size === "mid"
                    ? "bg-down/60"
                    : "bg-down/30"
            }`}
          />
        ))}
      </div>

      <div className="mt-2 h-3 w-full overflow-hidden border-2 border-ink bg-surface">
        <div className="flex h-full">
          <div className="bg-up" style={{ width: `${buyPct}%` }} />
          <div className="bg-down" style={{ width: `${100 - buyPct}%` }} />
        </div>
      </div>
      <div className="mt-1 flex justify-between font-pixel text-[8px]">
        <span className="text-up">{buyPct} BUY</span>
        <span className="text-down">{100 - buyPct} SELL</span>
      </div>
    </div>
  );
}

export type RadarPoint = [string, number];

/** Hexagonal attention radar — the "mind graph". Pure SVG, pixel-rendered. */
export function AttentionRadar({
  axes,
  labels,
}: {
  axes: number[];
  labels: string[];
}) {
  const size = 240;
  const center = size / 2;
  const radius = 88;
  const count = Math.max(3, axes.length);

  const angleOf = (index: number) =>
    (Math.PI * 2 * index) / count - Math.PI / 2;

  const pointAt = (index: number, value: number) => {
    const angle = angleOf(index);
    const r = (Math.min(100, Math.max(0, value)) / 100) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const polygon = axes.map((value, index) => pointAt(index, value).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Attention profile radar">
      {/* web rings */}
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, index) => {
            const angle = angleOf(index);
            return `${center + ring * radius * Math.cos(angle)},${center + ring * radius * Math.sin(angle)}`;
          }).join(" ")}
          fill="none"
          stroke="#566c86"
          strokeOpacity={0.35}
          strokeDasharray="2 3"
        />
      ))}
      {/* spokes */}
      {axes.map((_, index) => {
        const [x, y] = pointAt(index, 100);
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#566c86"
            strokeOpacity={0.35}
            strokeDasharray="2 3"
          />
        );
      })}
      {/* value polygon */}
      <polygon points={polygon} fill="#38b764" fillOpacity={0.22} stroke="#38b764" strokeWidth={2} />
      {/* vertices */}
      {axes.map((value, index) => {
        const [x, y] = pointAt(index, value);
        return <rect key={index} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="#38b764" />;
      })}
      {/* labels */}
      {labels.map((label, index) => {
        const [x, y] = pointAt(index, 128);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#94b0c2"
            fontSize={11}
            fontFamily="var(--font-press-start)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
