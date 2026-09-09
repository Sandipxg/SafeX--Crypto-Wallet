import { formatEther, formatUnits } from 'viem'
import {
  ClientTxRecord,
  getClientTxHistory,
  saveClientTx,
} from '../crypto/transactions/transactionStorage'

/**
 * ============================================================================
 * fetchOnChainTransactions(address, chainId)
 * ============================================================================
 * @description Queries public block explorer indexer (MetaMask / Trust Wallet pattern):
 *              - Sepolia: https://eth-sepolia.blockscout.com/api
 *              - Mainnet: https://eth.blockscout.com/api
 *              Fetches native ETH and ERC-20 token transfer events.
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

    const [txRes, tokenRes] = await Promise.all([
      fetch(
        `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`,
        { headers: { Accept: 'application/json' } }
      ).catch(() => null),
      fetch(
        `${baseUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`,
        { headers: { Accept: 'application/json' } }
      ).catch(() => null),
    ])

    const records: ClientTxRecord[] = []

    // 1. Parse standard ETH transactions
    if (txRes && txRes.ok) {
      const data = await txRes.json()
      if (data.status === '1' && Array.isArray(data.result)) {
        for (const item of data.result) {
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
          saveClientTx(record).catch(() => {})
        }
      }
    }

    // 2. Parse ERC-20 token transfer events
    if (tokenRes && tokenRes.ok) {
      const data = await tokenRes.json()
      if (data.status === '1' && Array.isArray(data.result)) {
        for (const item of data.result) {
          const decimals = Number(item.tokenDecimal) || 18
          let formattedAmount = '0'
          try {
            formattedAmount = formatUnits(BigInt(item.value || '0'), decimals)
          } catch {
            formattedAmount = '0'
          }

          const record: ClientTxRecord = {
            id: `${item.hash}-${item.contractAddress}`,
            hash: item.hash,
            from: (item.from || '').toLowerCase() as `0x${string}`,
            to: (item.to || '').toLowerCase() as `0x${string}`,
            valueEth: '0',
            tokenSymbol: item.tokenSymbol || 'TOKEN',
            tokenAmount: formattedAmount,
            tokenAddress: (item.contractAddress || '').toLowerCase() as `0x${string}`,
            nonce: Number(item.nonce) || 0,
            chainId,
            status: 'confirmed',
            blockNumber: Number(item.blockNumber) || undefined,
            gasUsed: item.gasUsed,
            effectiveGasPrice: item.gasPrice,
            createdAt: item.timeStamp
              ? new Date(Number(item.timeStamp) * 1000).toISOString()
              : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          records.push(record)
          saveClientTx(record).catch(() => {})
        }
      }
    }

    return records
  } catch (err) {
    console.warn(
      '[SafeX HistoryService] Failed to fetch on-chain transactions, falling back to local cache:',
      err
    )
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
 *              3. Deduplicates by unique record ID and sorts by date descending.
 */
export async function getUnifiedHistory(
  address: string,
  chainId: number = 11155111
): Promise<ClientTxRecord[]> {
  const [localTxs, onChainTxs] = await Promise.all([
    getClientTxHistory(address, chainId).catch(() => [] as ClientTxRecord[]),
    fetchOnChainTransactions(address, chainId),
  ])

  // Map by id to deduplicate
  const map = new Map<string, ClientTxRecord>()

  // 1. Add local records first
  for (const tx of localTxs) {
    const key = tx.tokenAddress ? `${tx.hash}-${tx.tokenAddress}` : tx.hash
    map.set(key.toLowerCase(), tx)
  }

  // 2. Overwrite / insert with on-chain records
  for (const tx of onChainTxs) {
    const key = tx.tokenAddress ? `${tx.hash}-${tx.tokenAddress}` : tx.hash
    map.set(key.toLowerCase(), tx)
  }

  const unified = Array.from(map.values())

  // Sort descending by createdAt
  unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return unified
}
