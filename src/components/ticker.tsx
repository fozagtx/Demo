import Link from "next/link";
import type { HotMarket } from "@/lib/attention";
import { AssetMark, assetFromSymbol } from "./logos";

/** $$TICKER-style marquee: QUESTION · xB/xS · ATTN NN — seamless loop, pauses on hover. */
export function MarketTicker({ markets }: { markets: HotMarket[] }) {
  if (markets.length === 0) {
    return null;
  }

  const items = markets.map((market) => ({
    id: market.id,
    label: market.question,
    buys: market.buys,
    sells: market.sells,
    attention: market.attention,
  }));

  // Two copies of the track = seamless -50% translate loop.
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-b-3 border-ink bg-panel-2">
      <div className="ticker-track py-1.5">
        {doubled.map((item, index) => (
          <Link
            key={`${item.id}-${index}`}
            href={`/hot/${encodeURIComponent(item.id)}`}
            className="mx-4 inline-flex items-center gap-2 font-crt text-lg leading-none"
          >
            <AssetMark symbol={assetFromSymbol(item.label)} />
            <span className="text-ink">{item.label}</span>
            <span className="text-up">{item.buys}B</span>
            <span className="text-down">{item.sells}S</span>
            <span className="text-faint">·</span>
            <span className="font-mono text-sm text-warn">ATTN {item.attention}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
