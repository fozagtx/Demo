import { notFound } from "next/navigation";
import { ActionTable } from "@/components/action-table";
import { PnlAreaChart } from "@/components/charts";
import { PageShell } from "@/components/page-shell";
import { getMarket } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = await params;
  const market = await getMarket(marketId);

  if (!market) {
    notFound();
  }

  const trades = market.actionsList
    .filter((action) => action.price !== null)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  return (
    <PageShell title={market.symbol} eyebrow={market.id}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="ACTIONS" value={market.actions.toString()} />
        <Stat label="STATUS" value={market.settled ? "SETTLED" : "LIVE"} />
        <Stat label="RISK FLAGS" value={market.riskFlags.toString()} />
        <Stat label="VOLUME" value={market.volume.toString()} />
      </div>

      <section className="pxl mt-6 bg-panel">
        <div className="border-b-2 border-ink bg-panel-2 px-4 py-2.5">
          <h2 className="font-pixel text-[11px]">FILL PRICE OVER TIME</h2>
          <p className="font-crt text-base text-muted">observed trades, oldest → newest</p>
        </div>
        <div className="px-3 py-4">
          <PnlAreaChart
            points={trades.map((trade) => ({
              label: trade.occurredAt.slice(5, 10),
              value: trade.price ?? 0,
            }))}
          />
        </div>
      </section>

      <section className="pxl mt-6 bg-panel">
        <div className="border-b-2 border-ink bg-panel-2 px-4 py-2.5">
          <h2 className="font-pixel text-[11px]">LOGGED ACTIONS</h2>
          <p className="font-crt text-base text-muted">every event on this market</p>
        </div>
        <ActionTable actions={market.actionsList} />
      </section>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pxl-thin bg-panel p-4">
      <p className="font-pixel text-[9px] uppercase leading-relaxed text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
