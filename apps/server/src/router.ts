import { healthRouter } from './features/health/routers/health.router.js'

export const appRouter = {
  health: healthRouter
}

export type AppRouter = typeof appRouter
