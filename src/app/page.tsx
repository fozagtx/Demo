import Link from "next/link";
import { AttentionRadar } from "@/components/attention";
import { AssetMark, ScreenpadMark } from "@/components/logos";
import { config } from "@/lib/config";
import { assetOf, getHotMarkets } from "@/lib/attention";

export const dynamic = "force-dynamic";

function ago(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

function level(attention: number): { label: string; tone: string } {
  if (attention >= 75) return { label: "RAMPING", tone: "text-up" };
  if (attention >= 45) return { label: "STEADY", tone: "text-warn" };
  return { label: "FADING", tone: "text-down" };
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, hot] = await Promise.all([
    searchParams,
    getHotMarkets(config.hotCandidates).catch(() => []),
  ]);

  const term = (q ?? "").trim().toLowerCase();
  const matches = term
    ? hot.filter(
        (item) =>
          item.question.toLowerCase().includes(term) ||
          item.asset.toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term),
      )
    : hot;

  return (
    <main className="min-h-screen">
      {/* top bar */}
      <header className="border-b-3 border-ink bg-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ScreenpadMark size={26} />
            <span className="font-pixel text-[11px] tracking-wider">SCREENPAD</span>
          </div>
          <Link
            href="/dashboard"
            className="pxl-btn-thin border-2 border-ink bg-accent px-4 py-2 font-pixel text-[9px] text-surface"
          >
            OPEN APP →
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-14 text-center">
        <p className="font-crt text-xl text-muted">receipts · risk checks · scores</p>
        <h1 className="font-pixel mx-auto mt-4 max-w-3xl text-xl leading-[1.9] md:text-2xl">
          TRANSPARENT MARKET INTELLIGENCE FOR PREDICTION MARKETS
        </h1>
        <p className="font-crt mx-auto mt-4 max-w-2xl text-xl leading-7 text-muted">
          Screenpad watches DreamDEX on Somnia and turns every Event Contract
          trade into a receipt you can verify — who traded, what the market
          looked like, how it settled, who&apos;s winning.
        </p>

        {/* spotted-a-prediction search */}
        <form action="/" method="get" className="mx-auto mt-8 flex max-w-2xl gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="market, asset or market id (e.g. BTC, ETH)"
            className="pxl-thin min-w-0 flex-1 bg-panel px-4 py-3 font-crt text-xl text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="pxl-btn-thin border-2 border-ink bg-down px-6 py-3 font-pixel text-[9px] text-surface"
          >
            CHECK
          </button>
        </form>
        {term ? (
          <p className="font-crt mt-3 text-lg text-faint">
            {matches.length} match{matches.length === 1 ? "" : "es"} for “{q}”
          </p>
        ) : null}
      </section>

      {/* everything moving */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-pixel text-sm">EVERYTHING MOVING</h2>
          <p className="font-crt text-lg text-faint">
            live DreamDEX fills · ranked by attention
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="pxl mt-5 bg-panel p-8 text-center">
            <p className="font-pixel text-[10px] text-muted">[ NOTHING MOVING ON THAT TERM ]</p>
            <p className="font-crt mt-2 text-lg text-faint">
              either the chain is quiet or the indexer is napping — no invented rows here
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {matches.map((item, index) => {
              const lvl = level(item.attention);
              const asset = item.asset || assetOf(item.question);
              return (
                <Link
                  key={item.id}
                  href={`/hot/${encodeURIComponent(item.id)}`}
                  className="pxl-btn block bg-panel"
                >
                  <article className="flex items-center gap-4 px-4 py-3.5">
                    <span className="font-pixel w-8 text-[10px] text-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <AssetMark symbol={asset} size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-crt text-xl text-ink">
                          {item.question}
                        </h3>
                        {asset ? (
                          <span className="pxl-btn-thin border-2 border-ink bg-panel-2 px-2 py-0.5 font-pixel text-[8px] text-muted">
                            {asset}
                          </span>
                        ) : null}
                        <span className="pxl-btn-thin border-2 border-ink bg-panel-2 px-2 py-0.5 font-pixel text-[8px] text-muted">
                          {item.trades} TRADES
                        </span>
                      </div>
                      <p className="font-crt mt-1 text-lg text-faint">
                        {item.buys} buys · {item.sells} sells · {item.uniqueActors} actors · last{" "}
                        {ago(item.lastTradeMinutesAgo)}
                      </p>
                    </div>
                    <div className="w-40 shrink-0 text-right">
                      <p className={`font-pixel text-[9px] ${lvl.tone}`}>{lvl.label}</p>
                      <div className="mt-1.5 h-3 w-full border-2 border-ink bg-surface">
                        <div
                          className={`h-full ${lvl.tone === "text-up" ? "bg-up" : lvl.tone === "text-warn" ? "bg-warn" : "bg-down"}`}
                          style={{ width: `${item.attention}%` }}
                        />
                      </div>
                      <p className="font-mono mt-1 text-[10px] text-faint">
                        attn {item.attention}
                      </p>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/hot"
            className="pxl-btn-thin inline-block border-2 border-ink bg-panel-2 px-5 py-2.5 font-pixel text-[9px] text-ink"
          >
            FULL HOT BOARD →
          </Link>
        </div>
      </section>

      {/* what you get */}
      <section className="border-t-3 border-ink bg-panel-2">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 py-14 md:grid-cols-3">
          <div className="pxl-thin bg-panel p-5">
            <p className="font-pixel text-[10px] text-accent">RECEIPTS</p>
            <p className="font-crt mt-3 text-lg leading-6 text-muted">
              every trade gets a deterministic sha256 receipt and a one-click
              proof link to the Somnia block explorer
            </p>
          </div>
          <div className="pxl-thin bg-panel p-5">
            <p className="font-pixel text-[10px] text-accent">ATTENTION RADAR</p>
            <p className="font-crt mt-3 text-lg leading-6 text-muted">
              a six-axis mind-graph per market — buy pressure, flow, crowd,
              size, acceleration, freshness — straight from observed fills
            </p>
          </div>
          <div className="pxl-thin bg-panel p-5">
            <p className="font-pixel text-[10px] text-accent">SCORES</p>
            <p className="font-crt mt-3 text-lg leading-6 text-muted">
              actor PnL and scores computed over real settlement outcomes —
              the dips are real losses, the wins are real wins
            </p>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t-3 border-ink bg-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-2">
            <ScreenpadMark size={18} />
            <span className="font-crt text-lg text-faint">screenpad · no login, no wallet connect</span>
          </div>
          <Link href="/dashboard" className="font-crt text-lg text-accent hover:underline">
            explore the data →
          </Link>
        </div>
      </footer>
    </main>
  );
}
