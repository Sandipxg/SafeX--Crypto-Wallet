import { formatUnits } from 'viem'
import { getPublicClient } from '../client/publicClient.js'
import { validateEvmAddress } from '../utils/address.js'

export const erc20ReadAbi = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

export interface TokenMetadata {
  address: `0x${string}`
  name: string
  symbol: string
  decimals: number
  chainId: number
}

export interface TokenBalanceResult {
  token: TokenMetadata
  rawBalance: string
  formattedBalance: string
}

/**
 * Reads basic metadata (name, symbol, decimals) from an ERC-20 contract
 */
export async function getTokenMetadata(
  tokenAddress: string,
  chainId: number = 11155111
): Promise<TokenMetadata> {
  const validAddress = validateEvmAddress(tokenAddress)
  const client = getPublicClient(chainId)

  const [name, symbol, decimals] = await Promise.all([
    client.readContract({
      address: validAddress,
      abi: erc20ReadAbi,
      functionName: 'name',
    }).catch(() => 'Unknown Token'),
    client.readContract({
      address: validAddress,
      abi: erc20ReadAbi,
      functionName: 'symbol',
    }).catch(() => 'UNKNOWN'),
    client.readContract({
      address: validAddress,
      abi: erc20ReadAbi,
      functionName: 'decimals',
    }).catch(() => 18),
  ])

  return {
    address: validAddress,
    name,
    symbol,
    decimals: Number(decimals),
    chainId,
  }
}

/**
 * Fetches the ERC-20 token balance for a specific wallet address
 */
export async function getTokenBalance(
  walletAddress: string,
  tokenAddress: string,
  chainId: number = 11155111
): Promise<TokenBalanceResult> {
  const validWallet = validateEvmAddress(walletAddress)
  const validToken = validateEvmAddress(tokenAddress)
  const client = getPublicClient(chainId)

  const [metadata, rawBalance] = await Promise.all([
    getTokenMetadata(validToken, chainId),
    client.readContract({
      address: validToken,
      abi: erc20ReadAbi,
      functionName: 'balanceOf',
      args: [validWallet],
    }).catch(() => 0n),
  ])

  return {
    token: metadata,
    rawBalance: rawBalance.toString(),
    formattedBalance: formatUnits(rawBalance, metadata.decimals),
  }
}

/**
 * Batch queries token balances for multiple ERC-20 tokens in parallel
 */
export async function getTokenBalances(
  walletAddress: string,
  tokenAddresses: string[],
  chainId: number = 11155111
): Promise<TokenBalanceResult[]> {
  const results = await Promise.all(
    tokenAddresses.map((addr) =>
      getTokenBalance(walletAddress, addr, chainId).catch(() => null)
    )
  )

  return results.filter((res): res is TokenBalanceResult => res !== null)
}

/**
 * Queries current allowance granted by owner to spender
 */
export async function getTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  chainId: number = 11155111
): Promise<{ allowanceRaw: string; allowanceFormatted: string }> {
  const validToken = validateEvmAddress(tokenAddress)
  const validOwner = validateEvmAddress(ownerAddress)
  const validSpender = validateEvmAddress(spenderAddress)
  const client = getPublicClient(chainId)

  const [metadata, rawAllowance] = await Promise.all([
    getTokenMetadata(validToken, chainId),
    client.readContract({
      address: validToken,
      abi: erc20ReadAbi,
      functionName: 'allowance',
      args: [validOwner, validSpender],
    }).catch(() => 0n),
  ])

  return {
    allowanceRaw: rawAllowance.toString(),
    allowanceFormatted: formatUnits(rawAllowance, metadata.decimals),
  }
}
