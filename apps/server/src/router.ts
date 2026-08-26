import { healthRouter } from './features/health/routers/health.router.js'
import { authRouter } from './features/auth/auth.router.js'

export const appRouter = {
  health: healthRouter,
  auth: authRouter,
}

export type AppRouter = typeof appRouter
