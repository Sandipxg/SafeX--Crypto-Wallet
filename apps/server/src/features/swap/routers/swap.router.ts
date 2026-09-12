import { os } from '../../../core/orpc/server.js'
import { fetchSwapQuote } from '../services/quote.js'
import { buildSwapTransaction } from '../services/swapBuilder.js'
import { decodeSwapReceipt } from '../services/receiptParser.js'
import { getDexTokens, getDexConfig } from '../constants.js'

export const swapRouter = {
  getSwapQuote: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      tokenInAddress: string
      tokenOutAddress: string
      amountInFormatted?: string
      amountOutFormatted?: string
      mode?: 'EXACT_IN' | 'EXACT_OUT'
      slippageTolerancePercent?: number
      chainId?: number
    }
    return await fetchSwapQuote(input)
  }),

  buildSwapTx: os.handler(async (rawInput: unknown) => {
    try {
      const input = rawInput as {
        userAddress: string
        tokenInAddress: string
        tokenOutAddress: string
        amountInFormatted: string
        slippageTolerancePercent?: number
        deadlineMinutes?: number
        chainId?: number
      }
      return await buildSwapTransaction(input)
    } catch (err) {
      console.error('[buildSwapTx] Failed to build swap transaction:', err)
      throw err
    }
  }),

  decodeSwapReceipt: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      hash: string
      chainId?: number
    }
    return await decodeSwapReceipt(input.hash, input.chainId ?? 11155111)
  }),

  getAvailableTokens: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { chainId?: number } | undefined
    const chainId = input?.chainId ?? 11155111
    const tokens = getDexTokens(chainId)
    const config = getDexConfig(chainId)
    return { tokens, config }
  }),
}
