import { getAddress, formatUnits } from 'viem'
import { orpc } from '../orpc'
import { getBrowserRpcClient } from '../crypto/transactions/transactionBuilder'
import {
  TokenMetadata,
  TokenBalanceItem,
  CustomTokenRecord,
  standardErc20Abi,
} from '../crypto/tokens/tokenTypes'

export type { TokenBalanceItem, TokenMetadata }
import { getVerifiedTokensForChain } from '../crypto/tokens/tokenRegistry'
import {
  getCustomTokens,
  saveCustomToken,
  deleteCustomToken,
} from '../crypto/tokens/tokenStorage'
import { fetchMarketPrices } from './priceService'

/**
 * Fetches all tracked tokens (verified + custom) with live balances for the user.
 * Features dual-layer fallback: queries server oRPC first, then direct browser RPC if needed.
 */
export async function fetchUserTokensAndBalances(
  walletAddress: string,
  chainId: number = 11155111
): Promise<TokenBalanceItem[]> {
  if (!walletAddress) return []

  // 1. Gather all tokens: Verified default list + Custom imported from IndexedDB
  const verified = getVerifiedTokensForChain(chainId)
  let custom: CustomTokenRecord[] = []
  try {
    custom = await getCustomTokens(walletAddress, chainId)
  } catch (err) {
    console.warn('[SafeX] Failed to load custom tokens from IndexedDB:', err)
  }

  const customTokens: TokenMetadata[] = custom.map((c) => ({
    address: c.address,
    name: c.name,
    symbol: c.symbol,
    decimals: c.decimals,
    chainId: c.chainId,
    isCustom: true,
  }))

  // Deduplicate by contract address
  const tokenMap = new Map<string, TokenMetadata>()
  for (const t of verified) {
    tokenMap.set(t.address.toLowerCase(), t)
  }
  for (const t of customTokens) {
    tokenMap.set(t.address.toLowerCase(), t)
  }

  const allTokens = Array.from(tokenMap.values())
  const tokenAddresses = allTokens.map((t) => t.address)

  // 2. Fetch live market prices to compute USD equivalent
  let ethUsd = 2500
  let linkUsd = 14.50
  try {
    const market = await fetchMarketPrices()
    if (market?.ethereumUsd) ethUsd = market.ethereumUsd
    if (market?.chainlinkUsd) linkUsd = market.chainlinkUsd
  } catch {
    // default fallback
  }

  // Helper to estimate USD value
  const computeUsdValue = (symbol: string, formattedBal: string): string => {
    const num = Number(formattedBal)
    if (isNaN(num) || num <= 0) return '0.00'
    const sym = symbol.toUpperCase()

    let val = 0
    if (sym === 'USDC' || sym === 'USDT' || sym === 'DAI') {
      val = num
    } else if (sym === 'WETH' || sym === 'ETH') {
      val = num * ethUsd
    } else if (sym === 'WBTC') {
      val = num * (ethUsd * 25)
    } else if (sym === 'LINK') {
      val = num * linkUsd
    } else {
      val = num * 1.5
    }

    if (val > 0 && val < 0.01) {
      return '< 0.01'
    }
    return val.toFixed(2)
  }

  // 3. Query balances (Server oRPC -> Browser Fallback)
  try {
    const serverBalances = await orpc.wallet.getTokenBalances({
      walletAddress,
      tokenAddresses,
      chainId,
    })

    return serverBalances.map((item: any) => {
      const metadata = tokenMap.get(item.token.address.toLowerCase()) || item.token
      return {
        token: metadata,
        rawBalance: item.rawBalance,
        formattedBalance: item.formattedBalance,
        usdValue: computeUsdValue(metadata.symbol, item.formattedBalance),
      }
    })
  } catch (serverErr) {
    console.warn('[SafeX] Server token balances fetch failed, querying RPC directly:', serverErr)
    const client = getBrowserRpcClient(chainId)
    const validWallet = getAddress(walletAddress)

    const balancePromises = allTokens.map(async (token) => {
      try {
        const rawBal = (await client.readContract({
          address: token.address,
          abi: standardErc20Abi,
          functionName: 'balanceOf',
          args: [validWallet],
        })) as bigint

        const formatted = formatUnits(rawBal, token.decimals)
        return {
          token,
          rawBalance: rawBal.toString(),
          formattedBalance: formatted,
          usdValue: computeUsdValue(token.symbol, formatted),
        }
      } catch {
        return {
          token,
          rawBalance: '0',
          formattedBalance: '0',
          usdValue: '0.00',
        }
      }
    })

    return await Promise.all(balancePromises)
  }
}

/**
 * Validates, queries on-chain metadata, and imports a custom ERC-20 token into local IndexedDB
 */
export async function importCustomToken(
  contractAddress: string,
  chainId: number,
  walletAddress: string
): Promise<TokenMetadata> {
  const validTokenAddress = getAddress(contractAddress.trim()) as `0x${string}`
  const validWalletAddress = getAddress(walletAddress.trim()) as `0x${string}`

  let metadata: TokenMetadata

  try {
    // 1. Try server query
    const res = await orpc.wallet.getTokenMetadata({
      tokenAddress: validTokenAddress,
      chainId,
    })
    metadata = {
      address: validTokenAddress,
      name: res.name || 'Custom Token',
      symbol: res.symbol || 'CUSTOM',
      decimals: Number(res.decimals) || 18,
      chainId,
      isCustom: true,
    }
  } catch (serverErr) {
    console.warn('[SafeX] Server token metadata fetch failed, querying RPC directly:', serverErr)
    const client = getBrowserRpcClient(chainId)

    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: validTokenAddress,
        abi: standardErc20Abi,
        functionName: 'name',
      }).catch(() => 'Custom Token'),
      client.readContract({
        address: validTokenAddress,
        abi: standardErc20Abi,
        functionName: 'symbol',
      }).catch(() => 'CUSTOM'),
      client.readContract({
        address: validTokenAddress,
        abi: standardErc20Abi,
        functionName: 'decimals',
      }).catch(() => 18),
    ])

    metadata = {
      address: validTokenAddress,
      name: String(name),
      symbol: String(symbol),
      decimals: Number(decimals),
      chainId,
      isCustom: true,
    }
  }

  // 2. Persist in IndexedDB
  await saveCustomToken({
    address: validTokenAddress,
    name: metadata.name,
    symbol: metadata.symbol,
    decimals: metadata.decimals,
    chainId,
    walletAddress: validWalletAddress,
    createdAt: new Date().toISOString(),
  })

  return metadata
}

/**
 * Removes a custom token from local storage
 */
export async function removeCustomToken(
  contractAddress: string,
  walletAddress: string,
  chainId: number
): Promise<void> {
  await deleteCustomToken(contractAddress, walletAddress, chainId)
}
