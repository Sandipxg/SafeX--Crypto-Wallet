import { os } from '@orpc/server'
import { getBalance } from '../../core/blockchain/read/balance.js'
import { getPendingNonce } from '../../core/blockchain/read/nonce.js'
import { estimateGasFees } from '../../core/blockchain/read/gas.js'
import { getTransactionReceiptDetails } from '../../core/blockchain/read/receipt.js'
import { broadcastRawTransaction } from '../../core/blockchain/write/broadcast.js'
import { validateEvmAddress } from '../../core/blockchain/utils/address.js'
import {
  getTokenMetadata,
  getTokenBalance,
  getTokenBalances,
  getTokenAllowance,
} from '../../core/blockchain/read/tokens.js'

export const walletRouter = {
  getBalance: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { walletAddress: string; chainId?: number }
    const validAddress = validateEvmAddress(input.walletAddress)
    return await getBalance(validAddress, input.chainId ?? 11155111)
  }),

  getNonce: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { walletAddress: string; chainId?: number }
    const validAddress = validateEvmAddress(input.walletAddress)
    const nonce = await getPendingNonce(validAddress, input.chainId ?? 11155111)
    return { nonce }
  }),

  getGasEstimate: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      from: string
      to: string
      valueEth?: string
      data?: `0x${string}`
      chainId?: number
    }
    return await estimateGasFees(
      input.from,
      input.to,
      input.valueEth ?? '0',
      input.data ?? '0x',
      input.chainId ?? 11155111
    )
  }),

  broadcastTx: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      signedHex: `0x${string}`
      chainId?: number
    }
    // Stateless RPC Broadcast — ZERO server database writes
    const hash = await broadcastRawTransaction({
      signedHex: input.signedHex,
      chainId: input.chainId ?? 11155111,
    })
    return { hash, status: 'broadcasted' }
  }),

  getTxReceipt: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { hash: string; chainId?: number }
    return await getTransactionReceiptDetails(input.hash, input.chainId ?? 11155111)
  }),

  getTokenMetadata: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { tokenAddress: string; chainId?: number }
    return await getTokenMetadata(input.tokenAddress, input.chainId ?? 11155111)
  }),

  getTokenBalance: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      walletAddress: string
      tokenAddress: string
      chainId?: number
    }
    return await getTokenBalance(input.walletAddress, input.tokenAddress, input.chainId ?? 11155111)
  }),

  getTokenBalances: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      walletAddress: string
      tokenAddresses: string[]
      chainId?: number
    }
    return await getTokenBalances(input.walletAddress, input.tokenAddresses, input.chainId ?? 11155111)
  }),

  getTokenAllowance: os.handler(async (rawInput: unknown) => {
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
