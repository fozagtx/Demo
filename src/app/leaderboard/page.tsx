import Link from "next/link";
import { formatSigned } from "@/components/format";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { getLeaderboard } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaders = await getLeaderboard();
  const top = leaders[0]?.averageScore ?? 1;

  return (
    <PageShell title="RANKS" eyebrow="settled performance · scored on real outcomes">
      {leaders.length === 0 ? (
        <EmptyState
          title="NO SCORED ACTORS"
          message="The live explorer has not produced verified settlement scores yet, so the leaderboard stays empty."
        />
      ) : (
        <div className="space-y-4">
          {leaders.map((actor, index) => (
            <Link
              key={actor.id}
              href={`/actors/${encodeURIComponent(actor.id)}`}
              className="pxl block bg-panel p-4 hover:bg-panel-2"
            >
              <div className="grid items-center gap-4 md:grid-cols-[72px_1fr_110px_110px_180px]">
                <p
                  className={`font-pixel text-base ${
                    index === 0 ? "text-up" : "text-faint"
                  }`}
                >
                  #{index + 1}
                </p>
                <div>
                  <p className="font-mono text-sm font-bold text-ink">{actor.label}</p>
                  <p className="font-crt text-base text-faint">
                    {actor.type} · {actor.scoredActions} scored actions
                  </p>
                </div>
                <div>
                  <p className="font-pixel text-[8px] uppercase text-muted">PNL</p>
                  <p
                    className={`mt-1 font-mono text-sm font-bold tabular-nums ${
                      actor.pnl > 0 ? "text-up" : actor.pnl < 0 ? "text-down" : "text-muted"
                    }`}
                  >
                    {formatSigned(actor.pnl)}
                  </p>
                </div>
                <div>
                  <p className="font-pixel text-[8px] uppercase text-muted">AVG SCORE</p>
                  <p className="mt-1 font-mono text-sm font-bold tabular-nums">
                    {actor.averageScore}
                  </p>
                </div>
                <div className="h-3 w-full border-2 border-ink bg-surface">
                  <div
                    className="h-full bg-up"
                    style={{
                      width: `${Math.round(((actor.averageScore ?? 0) / top) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
