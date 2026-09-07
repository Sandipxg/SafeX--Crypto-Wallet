import { createPublicClient, http, fallback, PublicClient } from 'viem'
import { sepolia } from 'viem/chains'
import { config } from '../../config/env.js'

export const publicClient: PublicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http(config.sepoliaRpcUrl),
    http('https://rpc.sepolia.org'),
    http('https://sepolia.drpc.org'),
  ]),
})
