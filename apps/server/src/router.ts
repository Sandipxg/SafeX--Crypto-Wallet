import { healthRouter } from './features/health/routers/health.router.js'
import { walletRouter } from './features/wallet/wallet.router.js'

export const appRouter = {
  health: healthRouter,
  wallet: walletRouter,
}

export type AppRouter = typeof appRouter
