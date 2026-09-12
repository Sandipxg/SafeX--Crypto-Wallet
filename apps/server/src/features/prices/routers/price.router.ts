import { os } from '../../../core/orpc/server.js'
import { fetchMarketPrices } from '../services/price.service.js'

export const priceRouter = {
  getPrices: os.handler(async (_input?: unknown) => {
    return await fetchMarketPrices()
  }),
}
