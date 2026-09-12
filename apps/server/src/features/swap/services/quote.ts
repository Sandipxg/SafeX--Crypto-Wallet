import { formatUnits, parseUnits } from 'viem'
import { getPublicClient } from '../../../core/blockchain/client/publicClient.js'
import { validateEvmAddress } from '../../../core/blockchain/utils/address.js'
import { getTokenMetadata } from '../../../core/blockchain/read/tokens.js'
import {
  getDexConfig,
  getDexTokens,
  uniswapV2FactoryAbi,
  uniswapV2RouterAbi,
  NATIVE_ETH_ADDRESS,
} from '../constants.js'

export interface SwapQuoteParams {
  tokenInAddress: string
  tokenOutAddress: string
  amountInFormatted?: string
  amountOutFormatted?: string
  mode?: 'EXACT_IN' | 'EXACT_OUT'
  slippageTolerancePercent?: number
  chainId?: number
}

export interface SwapQuoteResult {
  tokenIn: {
    address: `0x${string}`
    symbol: string
    name: string
    decimals: number
    isNative: boolean
  }
  tokenOut: {
    address: `0x${string}`
    symbol: string
    name: string
    decimals: number
    isNative: boolean
  }
  amountInRaw: string
  amountInFormatted: string
  expectedAmountOutRaw: string
  expectedAmountOutFormatted: string
  minAmountOutRaw: string
  minAmountOutFormatted: string
  executionPrice: string
  inversePrice: string
  priceImpactPercent: number
  path: `0x${string}`[]
  routePathSymbols: string[]
  isDirectRoute: boolean
  isSimulatedFallback: boolean
  chainId: number
}

/**
 * Uniswap V2 AMM Constant-Product Formula (x * y = k) with 0.30% fee
 */
export const calculateAmountOut = (
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint => {
  if (amountIn <= 0n) return 0n
  if (reserveIn <= 0n || reserveOut <= 0n) return 0n

  const amountInWithFee = amountIn * 997n
  const numerator = amountInWithFee * reserveOut
  const denominator = reserveIn * 1000n + amountInWithFee
  return numerator / denominator
}

/**
 * Uniswap V2 AMM Constant-Product Formula to calculate required amountIn for exact amountOut
 */
export const calculateAmountIn = (
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint => {
  if (amountOut <= 0n) return 0n
  if (reserveIn <= 0n || reserveOut <= 0n || amountOut >= reserveOut) return 0n

  const numerator = reserveIn * amountOut * 1000n
  const denominator = (reserveOut - amountOut) * 997n
  return (numerator / denominator) + 1n
}

/**
 * Calculates minimum amount received after slippage deduction
 */
export const calculateSlippageBound = (
  expectedAmountOut: bigint,
  slippageTolerancePercent: number = 0.5
): bigint => {
  if (expectedAmountOut <= 0n) return 0n
  const clampedSlippage = Math.max(0.01, Math.min(50, slippageTolerancePercent))
  const basisPoints = BigInt(Math.round(clampedSlippage * 100))
  const factor = 10000n - basisPoints
  return (expectedAmountOut * factor) / 10000n
}

/**
 * Computes price impact percent between spot price and execution price
 */
export const calculatePriceImpact = (
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number => {
  if (amountIn <= 0n || amountOut <= 0n || reserveIn <= 0n || reserveOut <= 0n) {
    return 0
  }

  const spotRate = (reserveOut * 10n ** 18n) / reserveIn
  const execRate = (amountOut * 10n ** 18n) / amountIn

  if (spotRate <= execRate) return 0

  const impactBps = ((spotRate - execRate) * 10000n) / spotRate
  const impactPercent = Number(impactBps) / 100
  return Math.min(100, Math.max(0, impactPercent))
}

const resolveFastTokenMetadata = async (
  address: `0x${string}`,
  isNative: boolean,
  chainId: number
): Promise<{ address: `0x${string}`; name: string; symbol: string; decimals: number; chainId: number }> => {
  if (isNative || address.toLowerCase() === NATIVE_ETH_ADDRESS.toLowerCase()) {
    return {
      address: NATIVE_ETH_ADDRESS,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      chainId,
    }
  }

  const knownTokens = getDexTokens(chainId)
  const matched = knownTokens.find((t) => t.address.toLowerCase() === address.toLowerCase())
  if (matched) {
    return {
      address,
      name: matched.name,
      symbol: matched.symbol,
      decimals: matched.decimals,
      chainId,
    }
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Token metadata timeout')), 1500)
    )
    return await Promise.race([getTokenMetadata(address, chainId), timeoutPromise])
  } catch {
    return {
      address,
      name: 'Token',
      symbol: 'TOKEN',
      decimals: 18,
      chainId,
    }
  }
}

const cleanDecimalAmount = (val: string | undefined): string | null => {
  if (!val) return null
  const trimmed = val.trim()
  if (!trimmed || trimmed === '.' || trimmed === '0' || trimmed.endsWith('.')) return null
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null
  const num = Number(trimmed)
  if (isNaN(num) || num <= 0) return null
  return trimmed
}

/**
 * Fetches real-time quote for a swap across Uniswap V2 Router/Factory
 */
export const fetchSwapQuote = async (
  params: SwapQuoteParams
): Promise<SwapQuoteResult> => {
  const chainId = params.chainId ?? 11155111
  const config = getDexConfig(chainId)
  const client = getPublicClient(chainId)

  const isTokenInNative =
    params.tokenInAddress.toLowerCase() === NATIVE_ETH_ADDRESS.toLowerCase() ||
    params.tokenInAddress.toLowerCase() === 'eth'
  const isTokenOutNative =
    params.tokenOutAddress.toLowerCase() === NATIVE_ETH_ADDRESS.toLowerCase() ||
    params.tokenOutAddress.toLowerCase() === 'eth'

  const effectiveInAddress = isTokenInNative
    ? config.wethAddress
    : validateEvmAddress(params.tokenInAddress)
  const effectiveOutAddress = isTokenOutNative
    ? config.wethAddress
    : validateEvmAddress(params.tokenOutAddress)

  if (effectiveInAddress.toLowerCase() === effectiveOutAddress.toLowerCase()) {
    throw new Error('Input token and output token cannot be the same.')
  }

  const [tokenInMeta, tokenOutMeta] = await Promise.all([
    resolveFastTokenMetadata(effectiveInAddress, isTokenInNative, chainId),
    resolveFastTokenMetadata(effectiveOutAddress, isTokenOutNative, chainId),
  ])

  let path: `0x${string}`[] = [effectiveInAddress, effectiveOutAddress]
  let isDirectRoute = true

  if (
    effectiveInAddress.toLowerCase() !== config.wethAddress.toLowerCase() &&
    effectiveOutAddress.toLowerCase() !== config.wethAddress.toLowerCase()
  ) {
    try {
      const pairPromise = client.readContract({
        address: config.factoryAddress,
        abi: uniswapV2FactoryAbi,
        functionName: 'getPair',
        args: [effectiveInAddress, effectiveOutAddress],
      })
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Factory timeout')), 3500)
      )
      const directPair = await Promise.race([pairPromise, timeoutPromise]).catch(() => null)

      if (!directPair || directPair === '0x0000000000000000000000000000000000000000') {
        path = [effectiveInAddress, config.wethAddress, effectiveOutAddress]
        isDirectRoute = false
      }
    } catch {
      path = [effectiveInAddress, config.wethAddress, effectiveOutAddress]
      isDirectRoute = false
    }
  }

  const cleanedIn = cleanDecimalAmount(params.amountInFormatted)
  const cleanedOut = cleanDecimalAmount(params.amountOutFormatted)

  if (!cleanedIn && !cleanedOut) {
    return {
      tokenIn: {
        address: isTokenInNative ? NATIVE_ETH_ADDRESS : effectiveInAddress,
        symbol: tokenInMeta.symbol,
        name: tokenInMeta.name,
        decimals: tokenInMeta.decimals,
        isNative: isTokenInNative,
      },
      tokenOut: {
        address: isTokenOutNative ? NATIVE_ETH_ADDRESS : effectiveOutAddress,
        symbol: tokenOutMeta.symbol,
        name: tokenOutMeta.name,
        decimals: tokenOutMeta.decimals,
        isNative: isTokenOutNative,
      },
      amountInRaw: '0',
      amountInFormatted: '0',
      expectedAmountOutRaw: '0',
      expectedAmountOutFormatted: '0',
      minAmountOutRaw: '0',
      minAmountOutFormatted: '0',
      executionPrice: '0',
      inversePrice: '0',
      priceImpactPercent: 0,
      path,
      routePathSymbols: [tokenInMeta.symbol, tokenOutMeta.symbol],
      isDirectRoute,
      isSimulatedFallback: false,
      chainId,
    }
  }

  const isExactOut =
    params.mode === 'EXACT_OUT' ||
    (!cleanedIn && Boolean(cleanedOut))

  let amountInRaw = 0n
  let expectedAmountOutRaw = 0n
  let calculatedImpact = 0.30

  if (isExactOut) {
    let amountOutRaw = 0n
    try {
      amountOutRaw = parseUnits(cleanedOut || '0', tokenOutMeta.decimals)
    } catch {
      amountOutRaw = 0n
    }
    if (amountOutRaw <= 0n) {
      throw new Error('Invalid output amount requested')
    }
    expectedAmountOutRaw = amountOutRaw

    try {
      const routerPromise = client.readContract({
        address: config.routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: 'getAmountsIn',
        args: [amountOutRaw, path],
      }) as Promise<bigint[]>
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Router timeout')), 15000)
      )
      const routerAmounts = await Promise.race([routerPromise, timeoutPromise])
      if (!routerAmounts || routerAmounts.length === 0 || routerAmounts[0] === 0n) {
        throw new Error('Zero input amount returned by router')
      }
      amountInRaw = routerAmounts[0]
    } catch (err) {
      console.error('[fetchSwapQuote] getAmountsIn failed on-chain:', err)
      throw new Error(`Insufficient liquidity for ${tokenInMeta.symbol} -> ${tokenOutMeta.symbol} on Uniswap V2.`)
    }
  } else {
    try {
      amountInRaw = parseUnits(cleanedIn || '0', tokenInMeta.decimals)
    } catch {
      amountInRaw = 0n
    }
    if (amountInRaw <= 0n) {
      throw new Error('Invalid input amount requested')
    }

    try {
      const routerPromise = client.readContract({
        address: config.routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: 'getAmountsOut',
        args: [amountInRaw, path],
      }) as Promise<bigint[]>
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Router timeout')), 15000)
      )
      const routerAmounts = await Promise.race([routerPromise, timeoutPromise])

      if (!routerAmounts || routerAmounts.length === 0 || routerAmounts[routerAmounts.length - 1] === 0n) {
        throw new Error('Zero output amount returned by router')
      }
      expectedAmountOutRaw = routerAmounts[routerAmounts.length - 1]

      try {
        const microIn = amountInRaw / 100n > 1000n ? amountInRaw / 100n : 1000n
        const microAmounts = await client.readContract({
          address: config.routerAddress,
          abi: uniswapV2RouterAbi,
          functionName: 'getAmountsOut',
          args: [microIn, path],
        }) as bigint[]
        if (microAmounts && microAmounts.length > 0) {
          const microOut = microAmounts[microAmounts.length - 1]
          const spotRate = Number(microOut) / Number(microIn)
          const execRate = Number(expectedAmountOutRaw) / Number(amountInRaw)
          if (spotRate > 0 && spotRate >= execRate) {
            calculatedImpact = Math.max(0.3, ((spotRate - execRate) / spotRate) * 100)
          }
        }
      } catch {
        calculatedImpact = 0.30
      }

      const KNOWN_BENCHMARK_USD: Record<string, number> = {
        ETH: 2500,
        WETH: 2500,
        USDC: 1,
        USDT: 1,
        DAI: 1,
        LINK: 14.5,
        WBTC: 60000,
      }
      const inBenchmark = KNOWN_BENCHMARK_USD[tokenInMeta.symbol.toUpperCase()]
      const outBenchmark = KNOWN_BENCHMARK_USD[tokenOutMeta.symbol.toUpperCase()]
      if (inBenchmark && outBenchmark) {
        const inValueUsd = Number(formatUnits(amountInRaw, tokenInMeta.decimals)) * inBenchmark
        const outValueUsd = Number(formatUnits(expectedAmountOutRaw, tokenOutMeta.decimals)) * outBenchmark
        if (inValueUsd > 0 && outValueUsd < inValueUsd) {
          const benchmarkDeviationPercent = ((inValueUsd - outValueUsd) / inValueUsd) * 100
          calculatedImpact = Math.max(calculatedImpact, benchmarkDeviationPercent)
        }
      }
    } catch (err) {
      console.error('[fetchSwapQuote] getAmountsOut failed on-chain:', err)
      throw new Error(`Insufficient liquidity for ${tokenInMeta.symbol} -> ${tokenOutMeta.symbol} on Uniswap V2.`)
    }
  }

  const minAmountOutRaw = calculateSlippageBound(
    expectedAmountOutRaw,
    params.slippageTolerancePercent ?? 0.5
  )

  const finalAmountInFormatted = formatUnits(
    amountInRaw,
    tokenInMeta.decimals
  )
  const expectedAmountOutFormatted = formatUnits(
    expectedAmountOutRaw,
    tokenOutMeta.decimals
  )
  const minAmountOutFormatted = formatUnits(
    minAmountOutRaw,
    tokenOutMeta.decimals
  )

  const inNum = Number(finalAmountInFormatted)
  const outNum = Number(expectedAmountOutFormatted)
  const execPrice = inNum > 0 ? (outNum / inNum).toFixed(6) : '0'
  const invPrice = outNum > 0 ? (inNum / outNum).toFixed(6) : '0'

  const routePathSymbols = path.map((addr) => {
    if (addr.toLowerCase() === config.wethAddress.toLowerCase()) {
      return isTokenInNative && addr === path[0] ? 'ETH' : isTokenOutNative && addr === path[path.length - 1] ? 'ETH' : 'WETH'
    }
    if (addr.toLowerCase() === effectiveInAddress.toLowerCase()) return tokenInMeta.symbol
    if (addr.toLowerCase() === effectiveOutAddress.toLowerCase()) return tokenOutMeta.symbol
    return 'TOKEN'
  })

  return {
    tokenIn: {
      address: isTokenInNative ? NATIVE_ETH_ADDRESS : effectiveInAddress,
      symbol: tokenInMeta.symbol,
      name: tokenInMeta.name,
      decimals: tokenInMeta.decimals,
      isNative: isTokenInNative,
    },
    tokenOut: {
      address: isTokenOutNative ? NATIVE_ETH_ADDRESS : effectiveOutAddress,
      symbol: tokenOutMeta.symbol,
      name: tokenOutMeta.name,
      decimals: tokenOutMeta.decimals,
      isNative: isTokenOutNative,
    },
    amountInRaw: amountInRaw.toString(),
    amountInFormatted: finalAmountInFormatted,
    expectedAmountOutRaw: expectedAmountOutRaw.toString(),
    expectedAmountOutFormatted,
    minAmountOutRaw: minAmountOutRaw.toString(),
    minAmountOutFormatted,
    executionPrice: execPrice,
    inversePrice: invPrice,
    priceImpactPercent: Number(calculatedImpact.toFixed(2)),
    path,
    routePathSymbols,
    isDirectRoute,
    isSimulatedFallback: false,
    chainId,
  }
}
