import { createPublicClient, http, fallback, PublicClient } from 'viem'
import { sepolia, mainnet } from 'viem/chains'
import { config } from '../../config/env.js'

export const sepoliaPublicClient: PublicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http(config.sepoliaRpcUrl),
    http('https://rpc.sepolia.org'),
    http('https://sepolia.drpc.org'),
  ]),
})

export const mainnetPublicClient: PublicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http(config.mainnetRpcUrl),
    http('https://eth.llamarpc.com'),
    http('https://rpc.ankr.com/eth'),
    http('https://cloudflare-eth.com'),
  ]),
})

export function getPublicClient(chainId: number = 11155111): PublicClient {
  if (chainId === 1) {
    return mainnetPublicClient
  }
  return sepoliaPublicClient
}

// Backward compatibility export
export const publicClient = sepoliaPublicClient
