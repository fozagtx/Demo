import { notFound } from "next/navigation";
import { ActionTable } from "@/components/action-table";
import { ActivityHistogram, PnlAreaChart } from "@/components/charts";
import { formatSigned } from "@/components/format";
import { PageShell } from "@/components/page-shell";
import { getActor } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export default async function ActorDetailPage({
  params,
}: {
  params: Promise<{ actorId: string }>;
}) {
  const { actorId } = await params;
  const actor = await getActor(actorId);

  if (!actor) {
    notFound();
  }

  const timed = actor.actionsList
    .filter((action) => action.pnl !== null)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  const pnlPoints = timed.reduce<{ label: string; value: number }[]>(
    (points, action) => {
      const previous = points[points.length - 1]?.value ?? 0;
      const next = Number((previous + (action.pnl ?? 0)).toFixed(4));
      points.push({ label: action.occurredAt.slice(5, 10), value: next });
      return points;
    },
    [],
  );

  const scoreBuckets = new Map<number, number>();
  for (const action of actor.actionsList) {
    if (action.score === null) continue;
    const bucket = Math.floor(action.score / 10) * 10;
    scoreBuckets.set(bucket, (scoreBuckets.get(bucket) ?? 0) + 1);
  }
  const scorePoints = [...scoreBuckets.entries()]
    .sort(([left], [right]) => left - right)
    .map(([bucket, count]) => ({ label: `${bucket}s`, count }));

  return (
    <PageShell title={actor.label} eyebrow={`${actor.type} · ${actor.id}`}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="ACTIONS" value={actor.actions.toString()} />
        <Stat label="RISK FLAGS" value={actor.riskFlags.toString()} />
        <Stat
          label="PNL"
          value={formatSigned(actor.pnl)}
          tone={actor.pnl > 0 ? "up" : actor.pnl < 0 ? "down" : undefined}
        />
        <Stat label="AVG SCORE" value={actor.averageScore?.toString() ?? "--"} />
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="pxl bg-panel">
          <div className="border-b-2 border-ink bg-panel-2 px-4 py-2.5">
            <h2 className="font-pixel text-[11px]">CUMULATIVE PNL</h2>
            <p className="font-crt text-base text-muted">settled actions, oldest → newest</p>
          </div>
          <div className="px-3 py-4">
            <PnlAreaChart points={pnlPoints} />
          </div>
        </section>
        <section className="pxl bg-panel">
          <div className="border-b-2 border-ink bg-panel-2 px-4 py-2.5">
            <h2 className="font-pixel text-[11px]">SCORE DISTRIBUTION</h2>
            <p className="font-crt text-base text-muted">10-point buckets</p>
          </div>
          <div className="px-3 py-4">
            <ActivityHistogram buckets={scorePoints} />
          </div>
        </section>
      </section>

      <section className="pxl mt-6 bg-panel">
        <div className="border-b-2 border-ink bg-panel-2 px-4 py-2.5">
          <h2 className="font-pixel text-[11px]">ACTION LOG</h2>
          <p className="font-crt text-base text-muted">every observed event from this actor</p>
        </div>
        <ActionTable actions={actor.actionsList} />
      </section>
    </PageShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="pxl-thin bg-panel p-4">
      <p className="font-pixel text-[9px] uppercase leading-relaxed text-muted">{label}</p>
      <p
        className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
