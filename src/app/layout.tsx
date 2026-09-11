import type { Metadata } from "next";
import { JetBrains_Mono, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { MarketTicker } from "@/components/ticker";
import { getHotMarkets } from "@/lib/attention";
import { config } from "@/lib/config";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: ["400"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Screenpad — DreamDEX Action Explorer",
  description:
    "Transparent market intelligence for prediction markets on Somnia — receipts, risk checks, settlement outcomes, actor scores.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Best-effort ticker data; silently empty if the indexer is unreachable.
  const hot = await getHotMarkets(config.tickerLimit).catch(() => []);

  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${vt323.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="relative z-[70]">
          <MarketTicker markets={hot} />
        </div>
        {children}
      </body>
    </html>
  );
}
