export interface MarketPrices {
  ethereumUsd: number
  bitcoinUsd: number
  chainlinkUsd: number
  updatedAt: number
}

let cachedPrices: MarketPrices | null = null
const CACHE_TTL_MS = 60 * 1000 // 60 seconds TTL

interface CoinGeckoSimplePriceResponse {
  ethereum?: { usd?: number }
  bitcoin?: { usd?: number }
  chainlink?: { usd?: number }
}

export const fetchMarketPrices = async (): Promise<MarketPrices> => {
  const now = Date.now()
  if (cachedPrices && now - cachedPrices.updatedAt < CACHE_TTL_MS) {
    return cachedPrices
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,chainlink&vs_currencies=usd',
      { headers: { Accept: 'application/json' } }
    )

    if (!res.ok) {
      throw new Error(`CoinGecko HTTP error: ${res.status}`)
    }

    const data = (await res.json()) as CoinGeckoSimplePriceResponse
    const ethereumUsd = Number(data.ethereum?.usd) || 2500
    const bitcoinUsd = Number(data.bitcoin?.usd) || 65000
    const chainlinkUsd = Number(data.chainlink?.usd) || 14.50

    cachedPrices = {
      ethereumUsd,
      bitcoinUsd,
      chainlinkUsd,
      updatedAt: now,
    }

    return cachedPrices
  } catch (error) {
    console.warn('[SafeX PriceService] Failed to fetch live market prices, using fallback rates:', error)
    return {
      ethereumUsd: cachedPrices?.ethereumUsd || 2500,
      bitcoinUsd: cachedPrices?.bitcoinUsd || 65000,
      chainlinkUsd: cachedPrices?.chainlinkUsd || 14.50,
      updatedAt: now,
    }
  }
}
