import { os } from '../../../core/orpc/server.js'
import { getBalance } from '../../../core/blockchain/read/balance.js'
import { getPendingNonce } from '../../../core/blockchain/read/nonce.js'
import { estimateGasFees } from '../../../core/blockchain/read/gas.js'
import { getTransactionReceiptDetails } from '../../../core/blockchain/read/receipt.js'
import { broadcastRawTransaction } from '../../../core/blockchain/write/broadcast.js'
import { validateEvmAddress } from '../../../core/blockchain/utils/address.js'
import { swapRouter } from '../../swap/routers/swap.router.js'
import { tokenRouter } from '../../tokens/routers/token.router.js'

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
      input.valueEth || '0',
      input.data || '0x',
      input.chainId ?? 11155111
    )
  }),

  getTxReceipt: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { hash: string; chainId?: number }
    return await getTransactionReceiptDetails(input.hash, input.chainId ?? 11155111)
  }),

  broadcastTx: os.handler(async (rawInput: unknown) => {
    const input = rawInput as { signedHex: `0x${string}`; chainId?: number }
    const txHash = await broadcastRawTransaction({
      signedHex: input.signedHex,
      chainId: input.chainId ?? 11155111,
    })
    return { txHash, hash: txHash }
  }),

  // Backward-compatibility aliases (delegated to tokenRouter)
  getTokenMetadata: tokenRouter.getMetadata,
  getTokenBalance: tokenRouter.getBalance,
  getTokenBalances: tokenRouter.getBalances,
  getTokenAllowance: tokenRouter.getAllowance,

  // Backward-compatibility aliases (delegated to swapRouter)
  getSwapQuote: swapRouter.getSwapQuote,
  buildSwapTx: swapRouter.buildSwapTx,
  decodeSwapReceipt: swapRouter.decodeSwapReceipt,
  getAvailableTokens: swapRouter.getAvailableTokens,
}
