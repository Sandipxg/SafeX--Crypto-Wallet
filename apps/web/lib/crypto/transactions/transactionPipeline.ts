import { signEip1559Transaction } from './transactionSigner'
import { UnsignedEip1559Request } from './transactionSerializer'
import { saveClientTx, ClientTxRecord } from './transactionStorage'
import { startClientTxPoller } from './transactionPoller'
import { getBrowserRpcClient } from './transactionBuilder'
import { orpc } from '../../orpc'

export interface ExecuteTransactionParams {
  password: string
  preparedTxRequest: UnsignedEip1559Request
  from: `0x${string}`
  to: `0x${string}`
  valueEth: string
}

export interface ExecuteTransactionResult {
  broadcastTxHash: string
  clientTx: ClientTxRecord
}

/**
 * ============================================================================
 * executeTransactionPipeline(params): Promise<ExecuteTransactionResult>
 * ============================================================================
 * @description Zero-Trust Client Transaction Execution Pipeline:
 *              1. Signs payload offline in RAM via `signEip1559Transaction()`.
 *              2. Broadcasts signed hex payload to RPC gateway (`orpc.wallet.broadcastTx`).
 *                 (Falls back to direct browser RPC if server is unavailable)
 *              3. Saves pending record to client-side IndexedDB (`saveClientTx`).
 *              4. Launches client background poller to track mining (`startClientTxPoller`).
 *
 * @where_used  apps/web/app/(dashboard)/send/page.tsx
 */
export async function executeTransactionPipeline(
  params: ExecuteTransactionParams
): Promise<ExecuteTransactionResult> {
  const { password, preparedTxRequest, from, to, valueEth } = params
  const chainId = preparedTxRequest.chainId ?? 11155111

  // 1. Offline ECDSA Signing in RAM
  const { signedHex } = await signEip1559Transaction({
    password,
    txRequest: preparedTxRequest,
  })

  // 2. Broadcast signed raw payload to RPC Gateway (with fallback)
  let txHash: string
  try {
    const broadcastRes = await orpc.wallet.broadcastTx({
      signedHex,
      chainId,
    })
    txHash = broadcastRes.hash
  } catch (serverErr) {
    console.warn('[SafeX Client] Server broadcast failed, broadcasting via direct browser RPC:', serverErr)
    const client = getBrowserRpcClient(chainId)
    txHash = await client.sendRawTransaction({ serializedTransaction: signedHex })
  }

  // 3. Save pending transaction to CLIENT-SIDE IndexedDB
  const clientTx: ClientTxRecord = {
    id: crypto.randomUUID(),
    hash: txHash,
    from,
    to,
    valueEth,
    nonce: preparedTxRequest.nonce,
    chainId,
    status: 'broadcasted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await saveClientTx(clientTx)

  // 4. Start background polling worker
  startClientTxPoller(from)

  return {
    broadcastTxHash: txHash,
    clientTx,
  }
}

/**
 * ============================================================================
 * fetchTxReceiptStatus(hash, chainId): Promise<'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'>
 * ============================================================================
 * @description Helper function for UI receipt status checking with RPC fallback.
 */
export async function fetchTxReceiptStatus(
  hash: string,
  chainId: number = 11155111
): Promise<'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'> {
  try {
    const receipt = await orpc.wallet.getTxReceipt({ hash, chainId })
    return receipt.status as 'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'
  } catch {
    const client = getBrowserRpcClient(chainId)
    try {
      const receipt = await client.getTransactionReceipt({ hash: hash as `0x${string}` })
      if (!receipt) return 'pending'
      return receipt.status === 'success' ? 'confirmed' : 'failed'
    } catch {
      return 'pending'
    }
  }
}

