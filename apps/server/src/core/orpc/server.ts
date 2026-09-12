import { os } from '@orpc/server'

export interface ORPCContext {
  clientIp?: string
  timestamp: number
}

/**
 * Base procedure builder for all SafeX oRPC procedures.
 * Can be extended with global middlewares (logging, timing, rate-limiting, error handling).
 */
export const publicProcedure = os
export { os }
