import { os } from '../../../core/orpc/server.js'
import {
  getTokenMetadata,
  getTokenBalance,
  getTokenBalances,
  getTokenAllowance,
} from '../../../core/blockchain/read/tokens.js'

export const tokenRouter = {
  getMetadata: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { tokenAddress: string; chainId?: number }
    return await getTokenMetadata(input.tokenAddress, input.chainId ?? 11155111)
  }),

  getBalance: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      walletAddress: string
      tokenAddress: string
      chainId?: number
    }
    return await getTokenBalance(
      input.walletAddress,
      input.tokenAddress,
      input.chainId ?? 11155111
    )
  }),

  getBalances: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      walletAddress: string
      tokenAddresses: string[]
      chainId?: number
    }
    return await getTokenBalances(
      input.walletAddress,
      input.tokenAddresses,
      input.chainId ?? 11155111
    )
  }),

  getAllowance: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      tokenAddress: string
      ownerAddress: string
      spenderAddress: string
      chainId?: number
    }
    return await getTokenAllowance(
      input.tokenAddress,
      input.ownerAddress,
      input.spenderAddress,
      input.chainId ?? 11155111
    )
  }),
}
