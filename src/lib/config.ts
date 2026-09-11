/**
 * Single source of truth for every non-secret runtime setting.
 * Secrets (DATABASE_URL etc.) stay in .env — never here.
 * Values are defaults for Somnia Shannon testnet + the DreamDEX indexer.
 */

export const config = {
  /** Marquee ticker + hot list depth. */
  tickerLimit: 10 as number,
  hotCandidates: 12 as number,
  hotLimitDefault: 8 as number,

  /** Activity fetch depth per market (trade tape window). */
  activityLimit: 120,
  /** Recent-action windows on dashboards/lists. */
  recentActionLimit: 300,
  /** Rows shown in compact tables. */
  compactRows: 10,

  /** Somnia Shannon testnet chain id (hex). */
  chainIdHex: "0xc488",
  /** Public block explorer for tx proof links. */
  txExplorerBase: "https://shannon-explorer.somnia.network/tx",

  /** DreamDEX indexer defaults (overridable via env, see dreamdex.ts). */
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",

  /** Attention scoring weights / normalization caps (0-100 axes). */
  attention: {
    /** trades/hour that saturates the flow axis. */
    flowSaturation: 20,
    /** distinct actors that saturates the crowd axis. */
    crowdSaturation: 12,
    /** minutes since last trade where freshness hits zero. */
    freshDecayMinutes: 240,
    /** minimum trades before a market gets an attention profile. */
    minTrades: 3,
  },
} as const;
