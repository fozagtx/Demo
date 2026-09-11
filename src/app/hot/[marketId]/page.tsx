import Link from "next/link";
import { notFound } from "next/navigation";
import { AttentionRadar, TradeTape } from "@/components/attention";
import { AssetMark } from "@/components/logos";
import { Panel } from "@/components/page-shell";
import { Sidebar } from "@/components/page-shell";
import { assetOf, getDreamdexMarketForAttention, getMarketAttention } from "@/lib/attention";

export const dynamic = "force-dynamic";

export default async function HotAnalysisPage({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = await params;
  const market = await getDreamdexMarketForAttention(marketId);

  if (!market) {
    notFound();
  }

  const analysis = await getMarketAttention(market);

  if (!analysis) {
    return (
      <div className="relative z-10 min-h-screen">
        <Sidebar />
        <div className="ml-56 px-8 py-6">
          <div className="pxl bg-panel p-10 text-center">
            <p className="font-pixel text-[11px] text-faint">[ NOT ENOUGH TRADES ]</p>
            <p className="mt-3 font-crt text-lg text-muted">
              This market has fewer than 3 recent trades, so no attention profile
              can be computed. We don&apos;t fabricate one.
            </p>
            <Link
              href="/hot"
              className="pxl-btn mt-6 inline-block border-2 border-line px-4 py-2 font-crt text-lg text-muted hover:border-ink hover:text-ink"
            >
              ← BACK TO HOT
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const axisLabels = ["BUY", "VOL", "FLOW", "CROWD", "SIZE", "FRESH"];
  const axisValues = [
    analysis.axes.buy,
    analysis.axes.vol,
    analysis.axes.flow,
    analysis.axes.crowd,
    analysis.axes.size,
    analysis.axes.fresh,
  ];

  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar />
      <div className="ml-56 px-8 py-6">
        <p className="font-crt text-lg text-faint">hot analysis · attention profile</p>
        <h1 className="mt-2 flex items-center gap-2 font-crt text-2xl leading-tight text-ink">
          <AssetMark symbol={assetOf(analysis.question)} />
          <span>{analysis.question}</span>
        </h1>
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* LEFT: tape + pressure */}
          <div className="space-y-5">
            <Panel title="TRADE TAPE" hint="recent fills, sized by magnitude">
              <div className="p-4">
                <TradeTape cells={analysis.tape} />
              </div>
            </Panel>

            <Panel title="CROWD SPLIT" hint="buys vs sells in the observed window">
              <div className="p-4">
                <div className="flex h-8 w-full overflow-hidden border-2 border-ink">
                  <div className="bg-up" style={{ width: `${analysis.buyPct}%` }} />
                  <div className="bg-down" style={{ width: `${analysis.sellPct}%` }} />
                </div>
                <div className="mt-2 grid grid-cols-2 font-crt text-lg">
                  <p className="text-up">
                    ▲ {analysis.buys} buying ({analysis.buyPct}%)
                  </p>
                  <p className="text-right text-down">
                    ▼ {analysis.sells} selling ({analysis.sellPct}%)
                  </p>
                </div>
                <p className="mt-3 font-crt text-base text-faint">
                  {analysis.uniqueActors} distinct actors · {analysis.trades} trades ·
                  last trade {analysis.lastTradeMinutesAgo}m ago
                </p>
              </div>
            </Panel>
          </div>

          {/* RIGHT: radar + scores */}
          <div className="space-y-5">
            <Panel title="ATTENTION PROFILE" hint="the mind graph">
              <div className="flex flex-col items-center p-4">
                <AttentionRadar axes={axisValues} labels={axisLabels} />
                <p
                  className={`mt-2 font-mono text-3xl font-bold tabular-nums ${
                    analysis.attention >= 60
                      ? "text-up"
                      : analysis.attention >= 35
                        ? "text-warn"
                        : "text-muted"
                  }`}
                >
                  {analysis.attention}
                  <span className="font-pixel text-[9px] text-faint"> /100 ATTN</span>
                </p>
              </div>
            </Panel>

            <Panel title="AXES" hint="0-100 per dimension">
              <div className="grid grid-cols-2 gap-3 p-4">
                {axisLabels.map((label, index) => (
                  <div key={label} className="border-2 border-line px-3 py-2">
                    <p className="font-pixel text-[8px] uppercase text-faint">{label}</p>
                    <p
                      className={`font-mono text-xl font-bold tabular-nums ${
                        axisValues[index] >= 60
                          ? "text-up"
                          : axisValues[index] < 35
                            ? "text-down"
                            : "text-warn"
                      }`}
                    >
                      {axisValues[index]}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-ink px-4 py-3">
                <p className="font-crt text-base leading-6 text-muted">{analysis.summary}</p>
              </div>
            </Panel>

            <Link
              href={`/markets/${encodeURIComponent(analysis.id)}`}
              className="pxl-btn block border-2 border-accent bg-panel px-4 py-3 text-center font-crt text-lg text-accent hover:bg-panel-2"
            >
              FULL MARKET PAGE →
            </Link>
          </div>
        </div>

        <p className="mt-6 font-crt text-base text-faint">
          ✎ every number here is computed from real DreamDEX fills. Attention
          decays with time since the last trade — nothing is cached or faked.
        </p>
      </div>
    </div>
  );
}
