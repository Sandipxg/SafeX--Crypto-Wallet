import { sepolia, Chain } from 'viem/chains'

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  11155111: sepolia, // Sepolia Testnet
}

export function getChainConfig(chainId: number = 11155111): Chain {
  const chain = SUPPORTED_CHAINS[chainId]
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}. SafeX currently supports Sepolia (11155111).`)
  }
  return chain
}
