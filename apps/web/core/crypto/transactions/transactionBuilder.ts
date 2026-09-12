import { createPublicClient, http, fallback, formatEther, parseEther } from 'viem'
import { sepolia, mainnet } from 'viem/chains'
import { orpc } from '../../orpc/client'
import { UnsignedEip1559Request } from './transactionSerializer'

export interface BuildTransactionParams {
  from: `0x${string}`
  to: `0x${string}`
  valueEth: string
  data?: `0x${string}`
  chainId?: number
}

export interface BuildTransactionResult {
  txRequest: UnsignedEip1559Request
  gasSummary: {
    maxFeePerGas: string
    maxPriorityFeePerGas: string
    estimatedGasUnits: string
    estimatedTotalFeeWei: string
  }
}

const customSepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
const customMainnetRpc = process.env.NEXT_PUBLIC_MAINNET_RPC_URL

export const browserSepoliaFallbackClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    ...(customSepoliaRpc ? [http(customSepoliaRpc)] : []),
    http('https://rpc.sepolia.org'),
    http('https://sepolia.drpc.org'),
    http('https://ethereum-sepolia-rpc.publicnode.com'),
  ]),
})

export const browserMainnetFallbackClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    ...(customMainnetRpc ? [http(customMainnetRpc)] : []),
    http('https://eth.llamarpc.com'),
    http('https://rpc.ankr.com/eth'),
    http('https://cloudflare-eth.com'),
  ]),
})

export function getBrowserRpcClient(chainId: number = 11155111) {
  return chainId === 1 ? browserMainnetFallbackClient : browserSepoliaFallbackClient
}

/**
 * ============================================================================
 * buildUnsignedTransaction(params): Promise<BuildTransactionResult>
 * ============================================================================
 * @description Network Orchestration Layer for EIP-1559 Transactions:
 *              1. Attempts server oRPC query first for nonce & gas estimation.
 *              2. Resilient fallback to direct browser RPC if server is unavailable.
 *              3. Assembles ready-to-sign UnsignedEip1559Request object.
 *
 * @where_used  apps/web/app/(dashboard)/send/page.tsx
 */
export async function buildUnsignedTransaction(
  params: BuildTransactionParams
): Promise<BuildTransactionResult> {
  const { from, to, valueEth, data = '0x', chainId = 11155111 } = params

  let nonce: number
  let maxFeePerGas: bigint
  let maxPriorityFeePerGas: bigint
  let gasLimit: bigint
  let totalFeeWei: bigint

  try {
    // 1. Primary: Query via server oRPC
    const [nonceRes, gasRes] = await Promise.all([
      orpc.wallet.getNonce({ walletAddress: from, chainId }),
      orpc.wallet.getGasEstimate({ from, to, valueEth, data, chainId }),
    ])

    nonce = nonceRes.nonce
    gasLimit = BigInt(gasRes.estimatedGasUnits)
    maxFeePerGas = BigInt(gasRes.maxFeePerGas)
    maxPriorityFeePerGas = BigInt(gasRes.maxPriorityFeePerGas)
    totalFeeWei = BigInt(gasRes.estimatedTotalFeeWei)
  } catch (serverErr) {
    console.warn('[SafeX Client] Server gas/nonce fetch failed, querying RPC directly:', serverErr)
    const client = getBrowserRpcClient(chainId)

    // 2. Direct Browser RPC Fallback
    const [clientNonce, fees] = await Promise.all([
      client.getTransactionCount({ address: from, blockTag: 'pending' }),
      client.estimateFeesPerGas(),
    ])

    nonce = clientNonce
    maxFeePerGas = fees.maxFeePerGas ?? 35000000000n
    maxPriorityFeePerGas = fees.maxPriorityFeePerGas ?? 2000000000n

    try {
      gasLimit = await client.estimateGas({
        account: from,
        to,
        value: parseEther(valueEth || '0'),
        data,
      })
    } catch {
      // Standard native ETH transfer without contract code is 21,000 gas units
      gasLimit = data === '0x' || !data ? 21000n : 100000n
    }

    totalFeeWei = gasLimit * maxFeePerGas
  }

  const txRequest: UnsignedEip1559Request = {
    chainId,
    nonce,
    to,
    valueEth,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    data,
  }

  return {
    txRequest,
    gasSummary: {
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      estimatedGasUnits: gasLimit.toString(),
      estimatedTotalFeeWei: totalFeeWei.toString(),
    },
  }
}

/**
 * ============================================================================
 * fetchWalletBalance(address, chainId): Promise<string>
 * ============================================================================
 * @description Highly resilient balance fetcher for Mainnet & Sepolia:
 *              1. Attempts server oRPC query first.
 *              2. Automatically falls back to direct browser RPC lookup if server fails.
 */
export async function fetchWalletBalance(
  address: `0x${string}`,
  chainId: number = 11155111
): Promise<string> {
  try {
    const res = await orpc.wallet.getBalance({ walletAddress: address, chainId })
    return res.formattedEth
  } catch (serverError) {
    console.warn('[SafeX Client] Server oRPC balance fetch failed, querying RPC directly:', serverError)
    const client = getBrowserRpcClient(chainId)
    const balanceWei = await client.getBalance({ address })
    return formatEther(balanceWei)
  }
}

