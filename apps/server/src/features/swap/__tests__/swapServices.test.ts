import { describe, it, expect } from 'vitest'
import {
  calculateAmountOut,
  calculateSlippageBound,
  calculatePriceImpact,
} from '../services/quote.js'
import { getDexConfig, getDexTokens } from '../constants.js'

describe('DEX & AMM Mathematical Quote Tests', () => {
  it('should compute exact Uniswap V2 constant product output with 0.30% fee', () => {
    // 10 ETH in pool, 25,000 USDC in pool ($2,500/ETH)
    // Swap 1 ETH -> expect ~2,266.5 USDC due to fee + price impact
    const reserveIn = 10n * 10n ** 18n
    const reserveOut = 25000n * 10n ** 6n
    const amountIn = 1n * 10n ** 18n

    const amountOut = calculateAmountOut(amountIn, reserveIn, reserveOut)

    // Formula: (1 * 0.997 * 25,000) / (10 + 1 * 0.997) = 24,925 / 10.997 ≈ 2,266.527234 USDC
    expect(amountOut).toBeGreaterThan(2260n * 10n ** 6n)
    expect(amountOut).toBeLessThan(2270n * 10n ** 6n)

    // Invariant check: (x + dx*0.997) * (y - dy) >= x * y
    const kInitial = reserveIn * reserveOut
    const kAfter = (reserveIn + amountIn) * (reserveOut - amountOut)
    expect(kAfter).toBeGreaterThanOrEqual(kInitial)
  })

  it('should return 0 when swap amount is 0 or pool reserves are 0', () => {
    expect(calculateAmountOut(0n, 1000n, 1000n)).toBe(0n)
    expect(calculateAmountOut(100n, 0n, 1000n)).toBe(0n)
    expect(calculateAmountOut(100n, 1000n, 0n)).toBe(0n)
  })

  it('should compute slippage deduction bounds accurately', () => {
    const expectedOut = 10000n * 10n ** 6n // 10,000 USDC

    // 0.5% slippage -> 9,950 USDC minimum received
    const minOut05 = calculateSlippageBound(expectedOut, 0.5)
    expect(minOut05).toBe(9950n * 10n ** 6n)

    // 1.0% slippage -> 9,900 USDC minimum received
    const minOut10 = calculateSlippageBound(expectedOut, 1.0)
    expect(minOut10).toBe(9900n * 10n ** 6n)

    // 0.1% slippage -> 9,990 USDC minimum received
    const minOut01 = calculateSlippageBound(expectedOut, 0.1)
    expect(minOut01).toBe(9990n * 10n ** 6n)
  })

  it('should calculate price impact accurately', () => {
    const reserveIn = 100n * 10n ** 18n
    const reserveOut = 250000n * 10n ** 6n

    // Tiny trade (0.01 ETH) -> nominal impact is just the 0.30% LP fee
    const tinyIn = 1n * 10n ** 16n
    const tinyOut = calculateAmountOut(tinyIn, reserveIn, reserveOut)
    const tinyImpact = calculatePriceImpact(tinyIn, tinyOut, reserveIn, reserveOut)
    expect(tinyImpact).toBeGreaterThanOrEqual(0.3)
    expect(tinyImpact).toBeLessThan(0.35)

    // Large trade (10 ETH out of 100 ETH pool = 10%) -> substantial price impact (~9-10%)
    const largeIn = 10n * 10n ** 18n
    const largeOut = calculateAmountOut(largeIn, reserveIn, reserveOut)
    const largeImpact = calculatePriceImpact(largeIn, largeOut, reserveIn, reserveOut)
    expect(largeImpact).toBeGreaterThan(8)
    expect(largeImpact).toBeLessThan(11)
  })

  it('should return valid chain config and token lists for Sepolia and Mainnet', () => {
    const sepoliaConfig = getDexConfig(11155111)
    expect(sepoliaConfig.chainId).toBe(11155111)
    expect(sepoliaConfig.routerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(sepoliaConfig.factoryAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(sepoliaConfig.wethAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)

    const sepoliaTokens = getDexTokens(11155111)
    expect(sepoliaTokens.length).toBeGreaterThanOrEqual(3)
    expect(sepoliaTokens.some((t) => t.symbol === 'ETH')).toBe(true)
    expect(sepoliaTokens.some((t) => t.symbol === 'USDC')).toBe(true)

    const mainnetConfig = getDexConfig(1)
    expect(mainnetConfig.chainId).toBe(1)
    const mainnetTokens = getDexTokens(1)
    expect(mainnetTokens.length).toBeGreaterThanOrEqual(4)
  })

  it('should fetch live swap quote for 0.0001 ETH to USDC', async () => {
    const { fetchSwapQuote } = await import('../services/quote.js')
    const quote = await fetchSwapQuote({
      tokenInAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      tokenOutAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      amountInFormatted: '0.0001',
      slippageTolerancePercent: 0.5,
      chainId: 11155111,
    })

    expect(quote).toBeDefined()
    expect(quote.tokenIn.symbol).toBe('ETH')
    expect(quote.tokenOut.symbol).toBe('USDC')
    expect(Number(quote.expectedAmountOutFormatted)).toBeGreaterThan(0)
  }, 25000)
})
