import { os } from '@orpc/server'
import { getBalance } from '../../core/blockchain/read/balance.js'
import { getPendingNonce } from '../../core/blockchain/read/nonce.js'
import { estimateGasFees } from '../../core/blockchain/read/gas.js'
import { getTransactionReceiptDetails } from '../../core/blockchain/read/receipt.js'
import { broadcastRawTransaction } from '../../core/blockchain/write/broadcast.js'
import { validateEvmAddress } from '../../core/blockchain/utils/address.js'

export const walletRouter = {
  getBalance: os.handler(async (input: { walletAddress: string; chainId?: number }) => {
    const validAddress = validateEvmAddress(input.walletAddress)
    return await getBalance(validAddress, input.chainId ?? 11155111)
  }),

  getNonce: os.handler(async (input: { walletAddress: string; chainId?: number }) => {
    const validAddress = validateEvmAddress(input.walletAddress)
    const nonce = await getPendingNonce(validAddress, input.chainId ?? 11155111)
    return { nonce }
  }),

  getGasEstimate: os.handler(async (input: {
    from: string
    to: string
    valueEth?: string
    data?: `0x${string}`
    chainId?: number
  }) => {
    return await estimateGasFees(
      input.from,
      input.to,
      input.valueEth ?? '0',
      input.data ?? '0x',
      input.chainId ?? 11155111
    )
  }),

  broadcastTx: os.handler(async (input: {
    signedHex: `0x${string}`
    chainId?: number
  }) => {
    // Stateless RPC Broadcast — ZERO server database writes
    const hash = await broadcastRawTransaction({
      signedHex: input.signedHex,
      chainId: input.chainId ?? 11155111,
    })
    return { hash, status: 'broadcasted' }
  }),

  getTxReceipt: os.handler(async (input: { hash: string; chainId?: number }) => {
    return await getTransactionReceiptDetails(input.hash, input.chainId ?? 11155111)
  }),
}

