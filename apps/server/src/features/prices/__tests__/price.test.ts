import { describe, it, expect } from 'vitest'
import { fetchMarketPrices } from '../services/price.service.js'
import { priceRouter } from '../routers/price.router.js'

describe('Backend Price Feature Tests', () => {
  it('should fetch market prices with valid numerical rates', async () => {
    const prices = await fetchMarketPrices()

    expect(prices).toBeDefined()
    expect(prices.ethereumUsd).toBeGreaterThan(0)
    expect(prices.bitcoinUsd).toBeGreaterThan(0)
    expect(prices.chainlinkUsd).toBeGreaterThan(0)
    expect(prices.updatedAt).toBeGreaterThan(0)
  }, 15000)

  it('should serve cached prices on successive calls', async () => {
    const p1 = await fetchMarketPrices()
    const p2 = await fetchMarketPrices()

    expect(p1.updatedAt).toBe(p2.updatedAt)
  })

  it('should execute priceRouter getPrices procedure', async () => {
    const prices = await (priceRouter.getPrices as unknown as () => Promise<ReturnType<typeof fetchMarketPrices>>)()
    expect(prices).toBeDefined()
    expect(prices.ethereumUsd).toBeGreaterThan(0)
  })
})
