import {
  SOMNIA_TESTNET_ADDRESSES,
  SomniaMarkets,
  type BinaryMarket,
  type MarketActivity,
  type SomniaMarketsClient,
} from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

import { config } from "./config";

let nativeClient: SomniaMarketsClient | null = null;

/**
 * Native indexer client. `createClient` is not re-exported from the SDK root,
 * so we build the unified client and use its native engine for read-only
 * indexer calls (markets + activity). No signer is configured: read-only.
 */
export function createDreamdexClient(): SomniaMarketsClient {
  if (!nativeClient) {
    nativeClient = new SomniaMarkets({
      indexerUrl: process.env.SOMNIA_INDEXER_URL ?? config.indexerUrl,
      chain: somniaShannon,
      wsRpcUrl: process.env.SOMNIA_WS_RPC_URL ?? config.wsRpcUrl,
      addresses: SOMNIA_TESTNET_ADDRESSES,
    }).client;
  }

  return nativeClient;
}

export async function listDreamdexMarkets(limit = 50): Promise<BinaryMarket[]> {
  return createDreamdexClient().listBinaryMarkets({
    limit,
    orderBy: "tradeCount",
  });
}

export async function getDreamdexMarket(marketId: string): Promise<BinaryMarket | null> {
  return createDreamdexClient().getBinaryMarket(marketId);
}

export async function listDreamdexMarketActivity(
  market: Pick<BinaryMarket, "id" | "poolAddress">,
  limit = 25,
): Promise<MarketActivity[]> {
  return createDreamdexClient().getMarketActivity(market.id, {
    limit,
    pool: market.poolAddress,
  });
}
