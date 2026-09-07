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
import { sepolia, mainnet } from 'viem/chains'

const browserSepoliaFallbackClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http('https://rpc.sepolia.org'),
    http('https://sepolia.drpc.org'),
    http('https://ethereum-sepolia-rpc.publicnode.com'),
  ]),
})

const browserMainnetFallbackClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http('https://eth.llamarpc.com'),
    http('https://rpc.ankr.com/eth'),
    http('https://cloudflare-eth.com'),
  ]),
})

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
    const client = chainId === 1 ? browserMainnetFallbackClient : browserSepoliaFallbackClient
    const balanceWei = await client.getBalance({ address })
    return formatEther(balanceWei)
  }
}
