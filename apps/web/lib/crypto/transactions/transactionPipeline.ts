import { signEip1559Transaction } from './transactionSigner'
import { UnsignedEip1559Request } from './transactionSerializer'
import { saveClientTx, ClientTxRecord } from './transactionStorage'
import { startClientTxPoller } from './transactionPoller'
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
 *              3. Saves pending record to client-side IndexedDB (`saveClientTx`).
 *              4. Launches client background poller to track mining (`startClientTxPoller`).
 *
 * @where_used  apps/web/app/(dashboard)/send/page.tsx
 */
export async function executeTransactionPipeline(
  params: ExecuteTransactionParams
): Promise<ExecuteTransactionResult> {
  const { password, preparedTxRequest, from, to, valueEth } = params

  // 1. Offline ECDSA Signing in RAM
  const { signedHex } = await signEip1559Transaction({
    password,
    txRequest: preparedTxRequest,
  })

  // 2. Broadcast signed raw payload to RPC Gateway
  const broadcastRes = await orpc.wallet.broadcastTx({
    signedHex,
    chainId: preparedTxRequest.chainId ?? 11155111,
  })

  // 3. Save pending transaction to CLIENT-SIDE IndexedDB
  const clientTx: ClientTxRecord = {
    id: crypto.randomUUID(),
    hash: broadcastRes.hash,
    from,
    to,
    valueEth,
    nonce: preparedTxRequest.nonce,
    chainId: preparedTxRequest.chainId ?? 11155111,
    status: 'broadcasted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await saveClientTx(clientTx)

  // 4. Start background polling worker
  startClientTxPoller(from)

  return {
    broadcastTxHash: broadcastRes.hash,
    clientTx,
  }
}

/**
 * ============================================================================
 * fetchTxReceiptStatus(hash): Promise<'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'>
 * ============================================================================
 * @description Helper function for UI receipt status checking.
 */
export async function fetchTxReceiptStatus(
  hash: string
): Promise<'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'> {
  const receipt = await orpc.wallet.getTxReceipt({ hash })
  return receipt.status as 'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'
}
