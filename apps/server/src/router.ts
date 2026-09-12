import { healthRouter } from './features/health/routers/health.router.js'
import { walletRouter } from './features/wallet/routers/wallet.router.js'
import { swapRouter } from './features/swap/routers/swap.router.js'
import { historyRouter } from './features/history/routers/history.router.js'
import { priceRouter } from './features/prices/routers/price.router.js'
import { tokenRouter } from './features/tokens/routers/token.router.js'

export const appRouter = {
  health: healthRouter,
  wallet: walletRouter,
  swap: swapRouter,
  history: historyRouter,
  prices: priceRouter,
  tokens: tokenRouter,
}

export type AppRouter = typeof appRouter
