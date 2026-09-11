# Screenpad

**Transparent market intelligence for prediction markets on Somnia.**

Screenpad watches DreamDEX (Somnia Shannon testnet) and turns raw Event Contract activity into receipts, risk context, settlement outcomes, actor scores, and a live attention radar — every number traces back to a transaction you can verify yourself.

No login. No wallet connect required. No mock rows.

## What's inside

| Surface | Route | What it shows |
|---|---|---|
| Landing | `/` | Hero + working search + **EVERYTHING MOVING** board ranked by attention |
| Dashboard | `/dashboard` | Live snapshot: stats, PnL curve, activity histogram, top actors, recent actions |
| Hot radar | `/hot` | Attention-ranked markets with buy/sell splits + radar previews |
| Prediction analysis | `/hot/[marketId]` | Trade-tape heatmap, crowd split, six-axis attention mind-graph |
| Markets | `/markets`, `/markets/[id]` | Live binary markets + per-market fill curve |
| Actors | `/actors`, `/actors/[id]` | Wallets/protocol actors with PnL + score distribution |
| Actions | `/actions`, `/actions/[id]` | Full receipt with sha256 hash + one-click tx proof on the Somnia explorer |
| Leaderboard | `/leaderboard` | Scores computed over real settlement outcomes |

A `$TICKER`-style marquee runs across the top of every app page, linking straight to each market's analysis.

## Stack

- **Next.js 16** (App Router, dynamic server rendering) + **Tailwind CSS 4**
- **recharts** — PnL curves, histograms, radars (step/pixel styled)
- **Drizzle ORM + Neon Postgres** — persisted markets, actors, actions, risk checks, settlements, scores
- **`@somnia-chain/markets-sdk`** — live reads from the DreamDEX indexer (read-only, no signer)
- **8-bit design system** — Press Start 2P + VT323 + JetBrains Mono, SWEETIE-16 palette, CRT scanlines, hard-shadow pixel boxes

## Data honesty rules

1. Every market, action, and actor comes from the live DreamDEX indexer — never generated.
2. Missing data renders as an explicit empty state, not filler rows.
3. Observed third-party trades stay `unchecked` for risk and `pending` for score until real settlement math exists.
4. Every executed action links to its tx on `shannon-explorer.somnia.network`.

Attention axes (buy / vol / flow / crowd / size / fresh) are deterministic heuristics over observed fills — the formula lives in `src/lib/attention.ts`, thresholds in `src/lib/config.ts`.

## Getting started

```bash
pnpm install
cp .env.example .env        # paste your Neon DATABASE_URL
pnpm db:migrate             # create tables on your Neon branch
pnpm dev                    # http://localhost:3000
```

Optional — persist live data and compute scores:

```bash
pnpm worker:markets         # index markets + observed actions
pnpm worker:settlements     # persist resolutions
pnpm worker:scores          # compute actor scores
pnpm tsx src/workers/db-check.ts   # row counts
```

Without `DATABASE_URL`, pages still work off live SDK reads; workers run and honestly skip persistence.

## Configuration

Non-secret defaults (indexer URL, chain id, attention thresholds, list depths) live in **`src/lib/config.ts`**. Secrets stay in `.env` (see `.env.example`): `DATABASE_URL`, optional `SOMNIA_INDEXER_URL` / `SOMNIA_WS_RPC_URL` overrides.

## Deploy

A **Render Blueprint** is included (`render.yaml`): Render → New → Blueprint → this repo, paste `DATABASE_URL` (Neon pooled string) when prompted. Build runs `pnpm install --frozen-lockfile && pnpm build`, start runs `pnpm start`.

## Verification

```bash
npx tsc --noEmit
pnpm lint
pnpm build
```

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
