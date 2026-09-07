import { orpc } from '../../orpc'
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

/**
 * ============================================================================
 * buildUnsignedTransaction(params): Promise<BuildTransactionResult>
 * ============================================================================
 * @description Network Orchestration Layer for EIP-1559 Transactions:
 *              1. Fetches current pending nonce from RPC (`orpc.wallet.getNonce`).
 *              2. Estimates gas fees and EIP-1559 fee rates (`orpc.wallet.getGasEstimate`).
 *              3. Assembles ready-to-sign UnsignedEip1559Request object.
 *
 * @where_used  apps/web/app/(dashboard)/send/page.tsx
 */
export async function buildUnsignedTransaction(
  params: BuildTransactionParams
): Promise<BuildTransactionResult> {
  const { from, to, valueEth, data = '0x', chainId = 11155111 } = params

  // 1. Parallel RPC fetch for nonce & gas estimation
  const [nonceRes, gasRes] = await Promise.all([
    orpc.wallet.getNonce({ walletAddress: from, chainId }),
    orpc.wallet.getGasEstimate({ from, to, valueEth, data, chainId }),
  ])

  const gasLimit = BigInt(gasRes.estimatedGasUnits)
  const maxFeePerGas = BigInt(gasRes.maxFeePerGas)
  const maxPriorityFeePerGas = BigInt(gasRes.maxPriorityFeePerGas)

  const txRequest: UnsignedEip1559Request = {
    chainId,
    nonce: nonceRes.nonce,
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
      maxFeePerGas: gasRes.maxFeePerGas,
      maxPriorityFeePerGas: gasRes.maxPriorityFeePerGas,
      estimatedGasUnits: gasRes.estimatedGasUnits,
      estimatedTotalFeeWei: gasRes.estimatedTotalFeeWei,
    },
  }
}

import { createPublicClient, http, fallback, formatEther } from 'viem'
import { sepolia } from 'viem/chains'

const browserFallbackClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http('https://rpc.sepolia.org'),
    http('https://sepolia.drpc.org'),
    http('https://ethereum-sepolia-rpc.publicnode.com'),
  ]),
})

/**
 * ============================================================================
 * fetchWalletBalance(address): Promise<string>
 * ============================================================================
 * @description Highly resilient balance fetcher:
 *              1. Attempts server oRPC query first.
 *              2. Automatically falls back to direct browser Sepolia RPC lookup if server fails.
 */
export async function fetchWalletBalance(address: `0x${string}`): Promise<string> {
  try {
    const res = await orpc.wallet.getBalance({ walletAddress: address })
    return res.formattedEth
  } catch (serverError) {
    console.warn('[SafeX Client] Server oRPC balance fetch failed, querying Sepolia RPC directly:', serverError)
    const balanceWei = await browserFallbackClient.getBalance({ address })
    return formatEther(balanceWei)
  }
}
