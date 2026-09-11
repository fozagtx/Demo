import Link from "next/link";
import type { ReactNode } from "react";

import { config } from "@/lib/config";
import { AssetMark, ScreenpadMark } from "./logos";
import { WalletConnect } from "./wallet-connect";

export const navItems = [
  { href: "/dashboard", label: "DASHBOARD", icon: "▚" },
  { href: "/hot", label: "HOT NOW", icon: "◆" },
  { href: "/markets", label: "MARKETS", icon: "▤" },
  { href: "/actors", label: "ACTORS", icon: "◉" },
  { href: "/actions", label: "ACTIONS", icon: "≡" },
  { href: "/leaderboard", label: "RANKS", icon: "★" },
];

export function Sidebar({ activeHref }: { activeHref?: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r-3 border-ink bg-panel">
      {/* brand */}
      <Link href="/" className="flex items-center gap-2.5 border-b-3 border-ink bg-panel-2 px-4 py-4">
        <ScreenpadMark size={26} />
        <span className="font-pixel text-[11px] tracking-wider">SCREENPAD</span>
      </Link>

      {/* wallet */}
      <div className="border-b-3 border-ink px-3 py-4">
        <WalletConnect />
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 border-2 px-3 py-2 font-crt text-lg leading-none ${
              item.href === activeHref
                ? "border-accent bg-panel-2 text-accent"
                : "border-transparent text-muted hover:border-line hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <span className="text-xs">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>


    </aside>
  );
}

export function Brand({ activeHref }: { activeHref?: string }) {
  return <Sidebar activeHref={activeHref} />;
}

export function PageShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar activeHref={undefined} />
      <div className="ml-56 min-h-screen">
        <div className="px-8 py-6">
          <p className="font-crt text-lg text-faint">{eyebrow ?? ""}</p>
          <h1 className="font-pixel mt-2 text-base leading-relaxed md:text-lg">{title}</h1>
          <div className="mt-6 space-y-6">{children}</div>
          <footer className="mt-10 pb-6" />
        </div>
  </div>
    </div>
  );
}

export function Panel({
  title,
  hint,
  right,
  children,
  className = "",
}: {
  title?: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`pxl bg-panel ${className}`}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-ink bg-panel-2 px-4 py-2.5">
          <div>
            <h2 className="font-pixel text-[10px] leading-relaxed">{title}</h2>
            {hint ? <p className="font-crt text-base text-muted">{hint}</p> : null}
          </div>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="pxl-thin bg-panel p-4">
      <p className="font-pixel text-[8px] uppercase leading-relaxed text-muted">{label}</p>
      <p
        className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink"
        }`}
      >
        {value}
  </p>
      {detail ? <p className="mt-1 font-crt text-base text-faint">{detail}</p> : null}
    </div>
  );
}

export function MicroLabel({ children }: { children: ReactNode }) {
  return <p className="font-pixel text-[8px] uppercase text-muted">{children}</p>;
}

export { AssetMark };
