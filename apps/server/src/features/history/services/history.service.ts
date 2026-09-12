import { formatEther, formatUnits } from 'viem'
import { validateEvmAddress } from '../../../core/blockchain/utils/address.js'

export interface OnChainTxRecord {
  id: string
  hash: string
  from: `0x${string}`
  to: `0x${string}`
  valueEth: string
  tokenSymbol?: string
  tokenAmount?: string
  tokenAddress?: `0x${string}`
  nonce: number
  chainId: number
  status: 'confirmed' | 'failed'
  blockNumber?: number
  gasUsed?: string
  effectiveGasPrice?: string
  createdAt: string
  updatedAt: string
}

interface BlockscoutTxItem {
  hash: string
  from?: string
  to?: string
  value?: string
  nonce?: string
  isError?: string
  blockNumber?: string
  gasUsed?: string
  gasPrice?: string
  timeStamp?: string
}

interface BlockscoutTokenTxItem extends BlockscoutTxItem {
  tokenDecimal?: string
  tokenSymbol?: string
  contractAddress?: string
}

interface BlockscoutApiResponse<T> {
  status: string
  message?: string
  result?: T[]
}

const getExplorerBaseUrl = (chainId: number): string => {
  return chainId === 1
    ? 'https://eth.blockscout.com/api'
    : 'https://eth-sepolia.blockscout.com/api'
}

export const fetchOnChainTransactions = async (
  rawAddress: string,
  chainId: number = 11155111
): Promise<OnChainTxRecord[]> => {
  const address = validateEvmAddress(rawAddress)
  const baseUrl = getExplorerBaseUrl(chainId)

  try {
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

    const records: OnChainTxRecord[] = []
    const now = new Date().toISOString()

    // 1. Parse standard ETH transactions
    if (txRes && txRes.ok) {
      const data = (await txRes.json()) as BlockscoutApiResponse<BlockscoutTxItem>
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

          records.push({
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
              : now,
            updatedAt: now,
          })
        }
      }
    }

    // 2. Parse ERC-20 token transfer events
    if (tokenRes && tokenRes.ok) {
      const data = (await tokenRes.json()) as BlockscoutApiResponse<BlockscoutTokenTxItem>
      if (data.status === '1' && Array.isArray(data.result)) {
        for (const item of data.result) {
          const decimals = Number(item.tokenDecimal) || 18
          let formattedAmount = '0'
          try {
            formattedAmount = formatUnits(BigInt(item.value || '0'), decimals)
          } catch {
            formattedAmount = '0'
          }

          records.push({
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
              : now,
            updatedAt: now,
          })
        }
      }
    }

    // Sort descending by createdAt
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return records
  } catch (err) {
    console.warn('[SafeX HistoryService] Failed to fetch on-chain transactions:', err)
    return []
  }
}
