import { getPublicClient } from '../client/publicClient.js'

export interface ReceiptDetails {
  status: 'confirmed' | 'failed' | 'pending'
  blockNumber: number | null
  gasUsed: string | null
  effectiveGasPrice: string | null
  transactionHash: string
}

export async function getTransactionReceiptDetails(
  txHash: string,
  chainId: number = 11155111
): Promise<ReceiptDetails> {
  try {
    const client = getPublicClient(chainId)
    const receipt = await client.getTransactionReceipt({
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
