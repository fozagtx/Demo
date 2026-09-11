import Link from "next/link";
import { AttentionRadar } from "@/components/attention";
import { AssetMark } from "@/components/logos";
import { PageShell } from "@/components/page-shell";
import { assetOf, getHotMarkets } from "@/lib/attention";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function HotPage() {
  const hot = await getHotMarkets(config.hotLimitDefault);

  return (
    <PageShell title="HOT RIGHT NOW" eyebrow="attention radar · ranked by live trade signals">
      {hot.length === 0 ? (
        <div className="pxl bg-panel p-10 text-center">
          <p className="font-pixel text-[11px] text-faint">[ NOTHING HOT RIGHT NOW ]</p>
          <p className="mt-3 font-crt text-lg text-muted">
            No market in the live window has enough recent trades to rank. Check
            back after the next burst of activity.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hot.map((market, index) => (
            <Link
              key={market.id}
              href={`/hot/${encodeURIComponent(market.id)}`}
              className="pxl block bg-panel p-4 hover:bg-panel-2"
            >
              <div className="grid items-center gap-4 lg:grid-cols-[54px_1fr_200px_170px]">
                <p
                  className={`font-pixel text-sm ${index === 0 ? "text-warn" : "text-faint"}`}
                >
                  #{index + 1}
                </p>

                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-crt text-xl leading-tight text-ink">
                    <AssetMark symbol={assetOf(market.question)} />
                    <span className="truncate">{market.question}</span>
                  </p>
                  <p className="mt-1 font-crt text-base text-faint">
                    {market.trades} trades · {market.uniqueActors} actors · last{" "}
                    {market.lastTradeMinutesAgo}m ago
                  </p>
                </div>

                {/* buy/sell split */}
                <div>
                  <div className="flex h-4 w-full overflow-hidden border-2 border-ink">
                    <div className="bg-up" style={{ width: `${market.buyPct}%` }} />
                    <div className="bg-down" style={{ width: `${market.sellPct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between font-pixel text-[8px]">
                    <span className="text-up">
                      {market.buys} BUY
                    </span>
                    <span className="text-down">{market.sells} SELL</span>
                  </div>
                </div>

                {/* attention score */}
                <div className="flex items-center justify-end gap-3">
                  <AttentionRadar
                    axes={[
                      market.axes.buy,
                      market.axes.vol,
                      market.axes.flow,
                      market.axes.crowd,
                      market.axes.size,
                      market.axes.fresh,
                    ]}
                    labels={["", "", "", "", "", ""]}
                  />
                  <div className="text-right">
                    <p className="font-pixel text-[8px] uppercase text-faint">ATTN</p>
                    <p
                      className={`font-mono text-2xl font-bold tabular-nums ${
                        market.attention >= 60
                          ? "text-up"
                          : market.attention >= 35
                            ? "text-warn"
                            : "text-muted"
                      }`}
                    >
                      {market.attention}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <p className="font-crt text-lg text-faint">
            ✎ attention = flow + crowd + acceleration + freshness + size, computed
            from real fills only. Click a row for the full analysis.
          </p>
        </div>
      )}
    </PageShell>
  );
}
