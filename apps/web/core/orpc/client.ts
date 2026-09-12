import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from '@safex/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const link = new RPCLink({
  url: API_BASE_URL
})

export const orpc = createORPCClient<AppRouter>(link)
