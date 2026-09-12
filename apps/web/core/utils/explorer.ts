/**
 * Utility functions for generating blockchain explorer URLs (Etherscan, Sepolia)
 */

export const getExplorerBaseUrl = (chainId: number): string => {
  return chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
}

export const getExplorerTxUrl = (chainId: number, hash: string): string => {
  return `${getExplorerBaseUrl(chainId)}/tx/${hash}`
}

export const getExplorerAddressUrl = (chainId: number, address: string): string => {
  return `${getExplorerBaseUrl(chainId)}/address/${address}`
}

export const getExplorerTokenUrl = (chainId: number, tokenAddress: string): string => {
  return `${getExplorerBaseUrl(chainId)}/token/${tokenAddress}`
}
