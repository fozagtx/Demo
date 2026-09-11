import Link from "next/link";
import { ActionTable } from "@/components/action-table";
import {
  ActivityHistogram,
  OutcomeSplit,
  PnlAreaChart,
} from "@/components/charts";
import { formatSigned } from "@/components/format";
import { EmptyState, SourceNotice } from "@/components/empty-state";
import { Panel, Sidebar, Stat } from "@/components/page-shell";
import { getExplorerSnapshot } from "@/lib/explorer";

export const dynamic = "force-dynamic";

function cumulativePnl(actions: { pnl: number | null; occurredAt: string }[]) {
  const timed = actions
    .filter((action) => action.pnl !== null)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  return timed.reduce<{ label: string; value: number }[]>((points, action) => {
    const previous = points[points.length - 1]?.value ?? 0;
    const next = Number((previous + (action.pnl ?? 0)).toFixed(4));
    points.push({ label: action.occurredAt.slice(5, 10), value: next });
    return points;
  }, []);
}

function activityBuckets(actions: { occurredAt: string }[]) {
  const buckets = new Map<string, number>();

  for (const action of actions) {
    const hour = action.occurredAt.slice(0, 13);
    buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-24)
    .map(([hour, count]) => ({ label: `${hour.slice(11)}h`, count }));
}

export default async function Home() {
  const snapshot = await getExplorerSnapshot();

  const pnlPoints = cumulativePnl(snapshot.actions);
  const buckets = activityBuckets(snapshot.actions);
  const yesCount = snapshot.actions.filter((a) => a.outcome === "YES").length;
  const noCount = snapshot.actions.filter((a) => a.outcome === "NO").length;
  const scoredActions = snapshot.actions.filter((a) => a.score !== null);
  const totalPnl = snapshot.actions.reduce((sum, a) => sum + (a.pnl ?? 0), 0);

  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar activeHref="/dashboard" />
      <div className="ml-56">
        <div className="px-8 py-6">
      {snapshot.sourceError ? (
        <div className="pb-5">
          <SourceNotice message={snapshot.sourceError} />
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="MARKETS" value={snapshot.markets.length.toLocaleString()} detail="live binary markets" />
        <Stat label="ACTIONS" value={snapshot.actions.length.toLocaleString()} detail="on-chain events" />
        <Stat label="ACTORS" value={snapshot.actors.length.toLocaleString()} detail="wallets + protocol" />
        <Stat label="CHECKS PENDING" value={snapshot.actions.filter((a) => a.riskResult === "unchecked").length.toLocaleString()} detail="awaiting receipts" />
        <Stat
          label="CUM. PNL"
          value={formatSigned(totalPnl)}
          detail={`${scoredActions.length} scored actions`}
          tone={totalPnl > 0 ? "up" : totalPnl < 0 ? "down" : undefined}
        />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="CUMULATIVE PNL"
          hint="running total across settled actions, oldest → newest"
          className="lg:col-span-2"
        >
          <div className="px-3 py-4">
            <PnlAreaChart points={pnlPoints} />
          </div>
        </Panel>

        <Panel title="OUTCOME SPLIT" hint="settled actions">
          <div className="px-3 py-4">
            <OutcomeSplit yes={yesCount} no={noCount} />
            <div className="mt-3 grid grid-cols-2 gap-2 px-2 font-crt text-lg">
              <p className="font-bold text-up">YES · {yesCount}</p>
              <p className="text-right font-bold text-down">NO · {noCount}</p>
            </div>
          </div>
        </Panel>

        <Panel title="ACTION ACTIVITY" hint="events per hour, last 24 buckets" className="lg:col-span-2">
          <div className="px-3 py-4">
            <ActivityHistogram buckets={buckets} />
          </div>
        </Panel>

        <Panel title="TOP ACTORS" hint="by action count">
          <div className="p-2">
            {snapshot.actors.slice(0, 5).map((actor) => (
              <Link
                key={actor.id}
                href={`/actors/${encodeURIComponent(actor.id)}`}
                className="flex items-center justify-between px-3 py-2 font-crt text-lg hover:bg-panel-2"
              >
                <span className="font-mono text-xs text-accent">{actor.label}</span>
                <span className="font-mono text-xs tabular-nums text-muted">
                  {actor.actions} actions
                </span>
              </Link>
            ))}
            {snapshot.actors.length === 0 ? (
              <p className="px-3 py-6 text-center font-pixel text-[9px] text-faint">
                [ NO ACTORS IN WINDOW ]
              </p>
            ) : null}
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="RECENT ACTIONS"
          hint="observed · receipts on click"
          right={
            <Link
              href="/actions"
              className="pxl-btn-thin border-2 border-line px-3 py-1 font-crt text-base text-muted hover:border-ink hover:text-ink"
            >
              ALL {snapshot.actions.length} →
            </Link>
          }
        >
          {snapshot.actions.length === 0 && !snapshot.sourceError ? (
            <EmptyState
              title="NO INDEXED ACTIONS"
              message="Live DreamDEX reads returned no activity rows for this window."
            />
          ) : (
            <ActionTable actions={snapshot.actions} compact />
          )}
        </Panel>

        <Panel title="LATEST RECEIPTS" hint="sha256 over action payloads">
          <div className="max-h-[420px] overflow-y-auto p-2">
            {snapshot.actions.slice(0, 8).map((action) => (
              <Link
                key={action.id}
                href={`/actions/${encodeURIComponent(action.id)}`}
                className="block px-2 py-2 hover:bg-panel-2"
              >
                <p className="font-mono text-[10px] text-accent">
                  {action.txHash ? `${action.txHash.slice(0, 18)}…` : "no tx"}
                </p>
                <p className="mt-0.5 font-crt text-base text-muted">
                  {action.actionType.replaceAll("_", " ")} · {action.marketSymbol.slice(0, 28)}
                </p>
              </Link>
            ))}
            {snapshot.actions.length === 0 ? (
              <p className="px-2 py-6 text-center font-pixel text-[9px] text-faint">[ NO RECEIPTS ]</p>
            ) : null}
          </div>
        </Panel>
      </section>


        </div>
      </div>
    </div>
  );
}
