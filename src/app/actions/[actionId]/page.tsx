import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getAction } from "@/lib/explorer";
import { hashReceipt } from "@/lib/receipts";
import { AssetMark, assetFromSymbol } from "@/components/logos";
import { TxLinkFull } from "@/components/tx-link";

export const dynamic = "force-dynamic";

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ actionId: string }>;
}) {
  const { actionId } = await params;
  const action = await getAction(actionId);

  if (!action) {
    notFound();
  }

  const receiptHash = hashReceipt(action);

  return (
    <PageShell title="ACTION RECEIPT" eyebrow={action.id}>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="pxl bg-panel">
          <div className="border-b-2 border-ink bg-panel-2 px-4 py-2.5">
            <h2 className="font-pixel text-[11px]">DECISION + EXECUTION</h2>
            <p className="font-crt text-base text-muted">one raw event, decoded</p>
          </div>
          <dl className="grid grid-cols-1 gap-px bg-line p-px sm:grid-cols-2">
            <Field
              label="MARKET"
              value={action.marketSymbol}
              asset={assetFromSymbol(action.marketSymbol)}
            />
            <Field label="ACTOR" value={action.actorLabel} />
            <Field label="ACTION" value={action.actionType.replaceAll("_", " ")} />
            <Field label="SIDE" value={action.side ?? "none"} />
            <Field label="PRICE" value={action.price?.toString() ?? "none"} />
            <Field label="SIZE" value={action.size?.toString() ?? "none"} />
            <Field label="RISK CHECK" value={action.riskResult} />
            <Field label="OUTCOME" value={action.outcome ?? "pending"} />
            <Field label="PNL" value={action.pnl === null ? "pending" : action.pnl.toFixed(4)} />
            <Field label="SCORE" value={action.score?.toString() ?? "pending"} />
            <Field label="MODE" value={action.mode} />
            <Field
              label="OBSERVED AT"
              value={action.occurredAt.replace("T", " ").slice(0, 19)}
            />
          </dl>
          <div className="border-t-2 border-ink px-4 py-3">
            <p className="font-pixel text-[9px] uppercase text-muted">TRANSACTION</p>
            <p className="mt-1.5 break-all font-mono text-xs text-up">
              {action.txHash ? <TxLinkFull txHash={action.txHash} /> : "not executed"}
            </p>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="pxl-thin bg-panel p-4">
            <p className="font-pixel text-[9px] uppercase text-muted">RECEIPT HASH</p>
            <p className="mt-2 break-all font-mono text-[11px] leading-5 text-muted">
              sha256 · {receiptHash}
            </p>
            <p className="mt-3 font-crt text-base text-faint">
              deterministic over the payload — same trade, same hash
            </p>
          </section>
          <section className="pxl bg-panel p-4">
            <p className="font-pixel text-[9px] uppercase text-accent">STANCE</p>
            <p className="mt-2 font-crt text-xl leading-7 text-ink">
              Every trade gets a receipt, a risk check, and a score.
            </p>
            <p className="mt-3 font-crt text-base leading-6 text-muted">
              Fields come from the DreamDEX indexer on Somnia. Nothing invented;
              pending fields stay pending until the chain confirms.
            </p>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}

function Field({
  label,
  value,
  asset,
}: {
  label: string;
  value: string;
  asset?: string;
}) {
  return (
    <div className="bg-panel px-4 py-3">
      <dt className="font-pixel text-[8px] uppercase text-muted">{label}</dt>
      <dd className="mt-1.5 flex items-center gap-1.5 break-all font-mono text-xs font-bold">
        {asset ? <AssetMark symbol={asset} /> : null}
        {value}
      </dd>
    </div>
  );
}
