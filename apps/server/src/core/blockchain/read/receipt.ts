import { publicClient } from '../client/publicClient.js'

export interface ReceiptDetails {
  status: 'confirmed' | 'failed' | 'pending'
  blockNumber: number | null
  gasUsed: string | null
  effectiveGasPrice: string | null
  transactionHash: string
}

export async function getTransactionReceiptDetails(
  txHash: string
): Promise<ReceiptDetails> {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    if (!receipt) {
      return {
        status: 'pending',
        blockNumber: null,
        gasUsed: null,
        effectiveGasPrice: null,
        transactionHash: txHash,
      }
    }

    return {
      status: receipt.status === 'success' ? 'confirmed' : 'failed',
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      transactionHash: receipt.transactionHash,
    }
  } catch {
    // If receipt not found yet, transaction is still pending in mempool
    return {
      status: 'pending',
      blockNumber: null,
      gasUsed: null,
      effectiveGasPrice: null,
      transactionHash: txHash,
    }
  }
}
