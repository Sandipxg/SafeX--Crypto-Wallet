export interface MarketPrices {
  ethereumUsd: number
  bitcoinUsd: number
  updatedAt: number
}

let cachedPrices: MarketPrices | null = null
const CACHE_TTL_MS = 60 * 1000 // 60 seconds TTL

/**
 * ============================================================================
 * fetchMarketPrices(): Promise<MarketPrices>
 * ============================================================================
 * @description Fetches live ETH & BTC USD spot rates from CoinGecko API.
 *              Caches responses in memory for 60 seconds to avoid API throttling.
 */
export async function fetchMarketPrices(): Promise<MarketPrices> {
  const now = Date.now()
  if (cachedPrices && now - cachedPrices.updatedAt < CACHE_TTL_MS) {
    return cachedPrices
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd',
      { headers: { Accept: 'application/json' } }
    )

    if (!res.ok) {
      throw new Error(`CoinGecko HTTP error: ${res.status}`)
    }

    const data = await res.json()
    const ethereumUsd = Number(data.ethereum?.usd) || 2500
    const bitcoinUsd = Number(data.bitcoin?.usd) || 65000

    cachedPrices = {
      ethereumUsd,
      bitcoinUsd,
      updatedAt: now,
    }

    return cachedPrices
  } catch (error) {
    console.warn('[SafeX PriceService] Failed to fetch live market prices, using fallback rates:', error)
    // Safe fallback estimates if CoinGecko is unreachable/throttled
    return {
      ethereumUsd: cachedPrices?.ethereumUsd || 2500,
      bitcoinUsd: cachedPrices?.bitcoinUsd || 65000,
      updatedAt: now,
    }
  }
}
