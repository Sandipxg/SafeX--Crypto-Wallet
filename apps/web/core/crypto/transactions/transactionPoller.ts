import { getPendingClientTxs, updateClientTxStatus } from './transactionStorage'
import { orpc } from '../../orpc/client'

let pollingTimer: ReturnType<typeof setInterval> | null = null

export async function syncPendingClientTxs(walletAddress: string): Promise<void> {
  if (!walletAddress) return

  try {
    const pendingTxs = await getPendingClientTxs(walletAddress)

    for (const tx of pendingTxs) {
      try {
        const receipt = await orpc.wallet.getTxReceipt({ hash: tx.hash })

        if (receipt.status !== 'pending') {
          await updateClientTxStatus(tx.hash, {
            status: receipt.status as 'confirmed' | 'failed',
            blockNumber: receipt.blockNumber ?? undefined,
            gasUsed: receipt.gasUsed ?? undefined,
            effectiveGasPrice: receipt.effectiveGasPrice ?? undefined,
          })
        }
      } catch {
        // Receipt not found yet, transaction still in mempool
      }
    }
  } catch {
    // Ignore storage errors in uninitialized environments
  }
}

export function startClientTxPoller(walletAddress: string, intervalMs: number = 4000): () => void {
  if (typeof window === 'undefined') return () => {}

  // Immediate first run
  syncPendingClientTxs(walletAddress)

  if (pollingTimer) {
    clearInterval(pollingTimer)
  }

  pollingTimer = setInterval(() => {
    syncPendingClientTxs(walletAddress)
  }, intervalMs)

  return () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }
}
