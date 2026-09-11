"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const FAINT = "#566c86";
const UP = "#38b764";
const DOWN = "#b13e53";

const TICK = {
  fill: FAINT,
  fontSize: 12,
  fontFamily: "var(--font-vt323)",
};

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function tooltipProps() {
  return {
    contentStyle: {
      background: "#242840",
      border: "2px solid #f4f4f4",
      borderRadius: 0,
      boxShadow: "4px 4px 0 0 #10121f",
      fontFamily: "var(--font-vt323)",
      fontSize: 16,
      padding: "4px 10px",
    },
    labelStyle: { color: "#94b0c2" },
    itemStyle: { color: "#f4f4f4" },
    cursor: { stroke: "#566c86", strokeDasharray: "2 2" },
  };
}

export type PnlPoint = { label: string; value: number };

export function PnlAreaChart({ points }: { points: PnlPoint[] }) {
  if (points.length === 0) {
    return <NoData note="waiting for settled trades" />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={points} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={UP} stopOpacity={0.3} />
            <stop offset="100%" stopColor={UP} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={FAINT} strokeOpacity={0.35} strokeDasharray="2 4" vertical={false} />
        <Tooltip
          {...tooltipProps()}
          formatter={(value: unknown) => {
            const number = asNumber(value);
            return [number >= 0 ? `+${number.toFixed(2)}` : number.toFixed(2), "PnL"];
          }}
        />
        <Area
          type="stepAfter"
          dataKey="value"
          stroke={UP}
          strokeWidth={2}
          fill="url(#pnlFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export type BucketPoint = { label: string; count: number };

export function ActivityHistogram({ buckets }: { buckets: BucketPoint[] }) {
  if (buckets.length === 0) {
    return <NoData note="no actions in this window" />;
  }

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={buckets} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={FAINT} strokeOpacity={0.35} strokeDasharray="2 4" vertical={false} />
        <Tooltip {...tooltipProps()} formatter={(value: unknown) => [`${asNumber(value)} actions`, "count"]} />
        <Bar dataKey="count" fill={UP} isAnimationActive={false} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OutcomeSplit({ yes, no }: { yes: number; no: number }) {
  const data = [
    { name: "YES", value: yes, fill: UP },
    { name: "NO", value: no, fill: DOWN },
  ];
  const total = yes + no;

  if (total === 0) {
    return <NoData note="no settled outcomes yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
        <XAxis type="number" hide domain={[0, total]} />
        <YAxis type="category" dataKey="name" tick={TICK} width={44} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipProps()} formatter={(value: unknown) => [`${asNumber(value)} actions`, ""]} />
        <Bar dataKey="value" isAnimationActive={false} maxBarSize={30}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreBars({ points }: { points: BucketPoint[] }) {
  if (points.length === 0) {
    return <NoData note="no scores in this window" />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={points} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={FAINT} strokeOpacity={0.35} strokeDasharray="2 4" vertical={false} />
        <Tooltip {...tooltipProps()} formatter={(value: unknown) => [`${asNumber(value)} actions`, "count"]} />
        <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} width={32} />
        <Bar dataKey="count" fill={UP} isAnimationActive={false} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function NoData({ note }: { note: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 border-2 border-dashed border-line">
      <p className="font-pixel text-[10px] text-faint">[ NO DATA ]</p>
      <p className="font-crt text-base text-faint">{note}</p>
    </div>
  );
}
