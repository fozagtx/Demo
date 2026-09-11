import Link from "next/link";
import { formatSigned } from "@/components/format";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { getActors } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export default async function ActorsPage() {
  const actors = await getActors();

  return (
    <PageShell title="ACTORS" eyebrow="wallets · apps · strategies · bots">
      {actors.length === 0 ? (
        <EmptyState
          title="NO ACTORS OBSERVED"
          message="No wallets or protocol actors were found in the currently indexed DreamDEX activity window."
        />
      ) : (
        <div className="pxl overflow-x-auto bg-panel">
          <div className="border-b-2 border-ink bg-panel-2 px-4 py-2 font-pixel text-[10px]">
            ACTOR LIST · {actors.length} ROWS
          </div>
          <table className="w-full min-w-[840px] border-collapse font-crt text-lg">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">actor</th>
                <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">type</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">actions</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">risk</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">pnl</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">avg score</th>
              </tr>
            </thead>
            <tbody>
              {actors.map((actor) => (
                <tr key={actor.id} className="border-b border-line hover:bg-panel-2">
                  <td className="px-3 py-2">
                    <Link
                      href={`/actors/${encodeURIComponent(actor.id)}`}
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      {actor.label}
                    </Link>
                    <p className="font-mono text-[10px] text-faint">{actor.id}</p>
                  </td>
                  <td className="px-3 py-2 text-muted">{actor.type}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                    {actor.actions}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                    {actor.riskFlags}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono text-xs font-bold tabular-nums ${
                      actor.pnl > 0 ? "text-up" : actor.pnl < 0 ? "text-down" : "text-muted"
                    }`}
                  >
                    {formatSigned(actor.pnl)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-bold tabular-nums">
                    {actor.averageScore ?? "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
