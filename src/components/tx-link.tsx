import { config } from "@/lib/config";

/**
 * Deterministic tx proof link to the Somnia Shannon block explorer.
 * Any real chain event can be verified in one click; unexecuted
 * actions (e.g. observed resolutions with no tx) stay plain text.
 */
export function somniaTxUrl(txHash: string): string {
  return `${config.txExplorerBase}/${txHash}`;
}

export function TxLink({
  txHash,
  className = "",
}: {
  txHash: string;
  className?: string;
}) {
  const short = `${txHash.slice(0, 10)}…${txHash.slice(-6)}`;

  return (
    <a
      href={somniaTxUrl(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      title={`verify on Somnia explorer — ${txHash}`}
      className={`inline-flex items-center gap-1 font-mono text-[11px] text-up underline decoration-dotted underline-offset-2 hover:text-accent ${className}`}
    >
      <span aria-hidden>⛓</span>
      {short}
    </a>
  );
}

export function TxLinkFull({ txHash }: { txHash: string }) {
  return (
    <a
      href={somniaTxUrl(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-mono text-xs text-up underline decoration-dotted underline-offset-2 hover:text-accent"
    >
      ⛓ {txHash} ↗ verify on Somnia explorer
    </a>
  );
}
