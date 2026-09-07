import { formatEther } from 'viem'
import { ClientTxRecord, getClientTxHistory, saveClientTx } from '../crypto/transactions/transactionStorage'

/**
 * ============================================================================
 * fetchOnChainTransactions(address, chainId)
 * ============================================================================
 * @description Queries public block explorer indexer (MetaMask / Trust Wallet pattern):
 *              - Sepolia: https://eth-sepolia.blockscout.com/api
 *              - Mainnet: https://eth.blockscout.com/api
 *              Fetches all mined incoming (faucet/deposits) and outgoing transactions.
 */
export async function fetchOnChainTransactions(
  address: string,
  chainId: number = 11155111
): Promise<ClientTxRecord[]> {
  try {
    const baseUrl =
      chainId === 1
        ? 'https://eth.blockscout.com/api'
        : 'https://eth-sepolia.blockscout.com/api'

    const url = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`

    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      throw new Error(`Explorer API HTTP ${res.status}`)
    }

    const data = await res.json()
    if (data.status !== '1' || !Array.isArray(data.result)) {
      return []
    }

    const records: ClientTxRecord[] = []

    for (const item of data.result) {
      // Format value from wei to ether
      let formattedValue = '0'
      try {
        if (item.value && item.value !== '0') {
          formattedValue = formatEther(BigInt(item.value))
        }
      } catch {
        formattedValue = '0'
      }

      const record: ClientTxRecord = {
        id: item.hash,
        hash: item.hash,
        from: (item.from || '').toLowerCase() as `0x${string}`,
        to: (item.to || '').toLowerCase() as `0x${string}`,
        valueEth: formattedValue,
        nonce: Number(item.nonce) || 0,
        chainId,
        status: item.isError === '0' ? 'confirmed' : 'failed',
        blockNumber: Number(item.blockNumber) || undefined,
        gasUsed: item.gasUsed,
        effectiveGasPrice: item.gasPrice,
        createdAt: item.timeStamp
          ? new Date(Number(item.timeStamp) * 1000).toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      records.push(record)

      // Cache into local IndexedDB in background for offline support
      saveClientTx(record).catch(() => {})
    }

    return records
  } catch (err) {
    console.warn('[SafeX HistoryService] Failed to fetch on-chain transactions, falling back to local cache:', err)
    return []
  }
}

/**
 * ============================================================================
 * getUnifiedHistory(address, chainId)
 * ============================================================================
 * @description Merges local optimistic transactions from IndexedDB with on-chain records:
 *              1. Reads local transactions (including pending sends).
 *              2. Pulls on-chain transactions (incoming deposits, faucets, mined sends).
 *              3. Deduplicates by hash and sorts by date descending.
 */
export async function getUnifiedHistory(
  address: string,
  chainId: number = 11155111
): Promise<ClientTxRecord[]> {
  const [localTxs, onChainTxs] = await Promise.all([
    getClientTxHistory(address, chainId).catch(() => [] as ClientTxRecord[]),
    fetchOnChainTransactions(address, chainId),
  ])

  // Map by hash to deduplicate (on-chain takes precedence for confirmed status)
  const map = new Map<string, ClientTxRecord>()

  // 1. Add local records first
  for (const tx of localTxs) {
    map.set(tx.hash.toLowerCase(), tx)
  }

  // 2. Overwrite / insert with on-chain records
  for (const tx of onChainTxs) {
    map.set(tx.hash.toLowerCase(), tx)
  }

  const unified = Array.from(map.values())

  // Sort descending by createdAt
  unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return unified
}
