import Link from "next/link";
import type { ExplorerAction, RiskResult } from "@/lib/types";
import { formatSigned } from "./format";
import { AssetMark, assetFromSymbol } from "./logos";
import { EmptyState } from "./empty-state";
import { TxLink } from "./tx-link";
import { config } from "@/lib/config";

const riskTone: Record<RiskResult, string> = {
  safe: "border-up text-up",
  risky: "border-warn text-warn",
  blocked: "border-down text-down",
  watch: "border-line text-muted",
  unchecked: "border-line text-faint",
};

export function ActionTable({
  actions,
  compact = false,
}: {
  actions: ExplorerAction[];
  compact?: boolean;
}) {
  if (actions.length === 0) {
    return (
      <EmptyState
        title="NO DATA"
        message="Live DreamDEX data returned nothing for this view. Screenpad does not generate filler rows."
      />
    );
  }

  const rows = compact ? actions.slice(0, config.compactRows) : actions;

  return (
    <div className="overflow-x-auto p-3">
      <table className="w-full min-w-[880px] border-collapse font-crt text-lg">
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">action</th>
            <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">market</th>
            <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">actor</th>
            <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">risk</th>
            <th className="px-3 py-2 font-pixel text-[9px] uppercase text-muted">outcome</th>
            <th className="px-3 py-2 text-right font-pixel text-[9px] uppercase text-muted">score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((action) => (
            <tr key={action.id} className="border-b border-line hover:bg-panel-2">
              <td className="px-3 py-2">
                <Link
                  href={`/actions/${encodeURIComponent(action.id)}`}
                  className="font-mono text-xs font-bold uppercase text-ink hover:text-accent"
                >
                  {action.actionType.replaceAll("_", " ")}
                </Link>
                <p className="max-w-[210px] truncate font-mono text-[10px] text-faint">
                  {action.txHash ? (
                    <TxLink txHash={action.txHash} />
                  ) : (
                    <span>no tx · {action.occurredAt.slice(0, 10)}</span>
                  )}
                </p>
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/markets/${encodeURIComponent(action.marketId)}`}
                  className="flex items-center gap-1.5 text-ink hover:text-accent"
                >
                  <AssetMark symbol={assetFromSymbol(action.marketSymbol)} />
                  <span className="truncate">{action.marketSymbol}</span>
                </Link>
                <p className="max-w-[190px] truncate font-mono text-[10px] text-faint">
                  {action.marketId}
                </p>
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/actors/${encodeURIComponent(action.actorId)}`}
                  className="font-mono text-xs text-accent hover:underline"
                >
                  {action.actorLabel}
                </Link>
                <p className="font-mono text-[10px] text-faint">{action.actorType}</p>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block border-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${riskTone[action.riskResult]}`}
                >
                  {action.riskResult}
                </span>
              </td>
              <td className="px-3 py-2">
                <p
                  className={`font-mono text-xs font-bold ${
                    action.outcome === "YES"
                      ? "text-up"
                      : action.outcome === "NO"
                        ? "text-down"
                        : "text-muted"
                  }`}
                >
                  {action.outcome ?? "pending"}
                </p>
                <p
                  className={`font-mono text-xs tabular-nums ${
                    action.pnl === null
                      ? "text-faint"
                      : action.pnl > 0
                        ? "text-up"
                        : action.pnl < 0
                          ? "text-down"
                          : "text-muted"
                  }`}
                >
                  {action.pnl === null ? "PnL pending" : `${formatSigned(action.pnl)} PnL`}
                </p>
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs font-bold tabular-nums">
                {action.score ?? "--"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {compact && actions.length > rows.length ? (
        <p className="px-3 pt-2 font-crt text-lg text-muted">
          ▼ {actions.length - rows.length} more rows in{" "}
          <Link href="/actions" className="text-accent hover:underline">
            /actions
          </Link>
        </p>
      ) : null}
    </div>
  );
}
