import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { AssetMark, assetFromSymbol } from "@/components/logos";
import { PageShell } from "@/components/page-shell";
import { getMarkets } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const markets = await getMarkets();

  return (
    <PageShell title="MARKETS" eyebrow="dreamdex event markets · live reads">
      {markets.length === 0 ? (
        <EmptyState
          title="NO MARKETS INDEXED"
          message="The explorer is connected to DreamDEX live reads, but the market list did not return rows."
        />
      ) : (
        <div className="pxl overflow-x-auto bg-panel">
          <div className="border-b-2 border-ink bg-panel-2 px-4 py-2 font-pixel text-[10px]">
            MARKET LIST · {markets.length} ROWS
          </div>
          <table className="w-full min-w-[840px] border-collapse font-crt text-lg">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">market</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">actions</th>
                <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">status</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">risk</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">volume</th>
                <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">latest</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => (
                <tr key={market.id} className="border-b border-line hover:bg-panel-2">
                  <td className="px-3 py-2">
                    <Link
                      href={`/markets/${encodeURIComponent(market.id)}`}
                      className="flex items-center gap-1.5 text-ink hover:text-accent"
                    >
                      <AssetMark symbol={assetFromSymbol(market.symbol)} />
                      <span className="truncate">{market.symbol}</span>
                    </Link>
                    <p className="max-w-[280px] truncate font-mono text-[10px] text-faint">
                      {market.id}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                    {market.actions}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block border-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        market.settled
                          ? "border-up text-up"
                          : "border-line text-muted"
                      }`}
                    >
                      {market.settled ? "SETTLED" : "LIVE"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                    {market.riskFlags}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                    {market.volume}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] tabular-nums text-muted">
                    {new Date(market.latestActionAt).toISOString().slice(0, 16).replace("T", " ")}
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
