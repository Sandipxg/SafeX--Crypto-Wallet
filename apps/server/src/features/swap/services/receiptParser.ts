import { decodeEventLog, formatUnits } from 'viem'
import { getPublicClient } from '../../../core/blockchain/client/publicClient.js'
import { uniswapV2PairAbi } from '../constants.js'
import { erc20ReadAbi } from '../../../core/blockchain/read/tokens.js'

export interface DecodedSwapEvent {
  pairAddress: `0x${string}`
  sender: `0x${string}`
  to: `0x${string}`
  amount0In: string
  amount1In: string
  amount0Out: string
  amount1Out: string
}

export interface DecodedTransferEvent {
  tokenAddress: `0x${string}`
  from: `0x${string}`
  to: `0x${string}`
  value: string
}

export interface DecodedSwapReceipt {
  status: 'confirmed' | 'failed' | 'pending'
  transactionHash: string
  blockNumber: number | null
  gasUsed: string | null
  effectiveGasPrice: string | null
  totalFeePaidEth: string | null
  swaps: DecodedSwapEvent[]
  transfers: DecodedTransferEvent[]
}

/**
 * Decodes and reconstructs on-chain Swap and Transfer event logs from a transaction receipt
 */
export const decodeSwapReceipt = async (
  txHash: string,
  chainId: number = 11155111
): Promise<DecodedSwapReceipt> => {
  const client = getPublicClient(chainId)

  let receipt
  try {
    receipt = await client.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    })
  } catch {
    return {
      status: 'pending',
      transactionHash: txHash,
      blockNumber: null,
      gasUsed: null,
      effectiveGasPrice: null,
      totalFeePaidEth: null,
      swaps: [],
      transfers: [],
    }
  }

  if (!receipt) {
    return {
      status: 'pending',
      transactionHash: txHash,
      blockNumber: null,
      gasUsed: null,
      effectiveGasPrice: null,
      totalFeePaidEth: null,
      swaps: [],
      transfers: [],
    }
  }

  const swaps: DecodedSwapEvent[] = []
  const transfers: DecodedTransferEvent[] = []

  for (const log of receipt.logs) {
    try {
      const decodedSwap = decodeEventLog({
        abi: uniswapV2PairAbi,
        eventName: 'Swap',
        data: log.data,
        topics: log.topics,
      })
      if (decodedSwap.eventName === 'Swap') {
        swaps.push({
          pairAddress: log.address,
          sender: decodedSwap.args.sender,
          to: decodedSwap.args.to,
          amount0In: decodedSwap.args.amount0In.toString(),
          amount1In: decodedSwap.args.amount1In.toString(),
          amount0Out: decodedSwap.args.amount0Out.toString(),
          amount1Out: decodedSwap.args.amount1Out.toString(),
        })
      }
    } catch {
      // Not a Swap log, check if it is an ERC-20 Transfer log
    }

    try {
      const decodedTransfer = decodeEventLog({
        abi: erc20ReadAbi,
        eventName: 'Transfer' as const,
        data: log.data,
        topics: log.topics,
      })
      if (decodedTransfer.eventName === 'Transfer') {
        const args = decodedTransfer.args as unknown as {
          from: `0x${string}`
          to: `0x${string}`
          value: bigint
        }
        transfers.push({
          tokenAddress: log.address,
          from: args.from,
          to: args.to,
          value: args.value.toString(),
        })
      }
    } catch {
      // Ignore other event logs
    }
  }

  const totalFeeWei =
    receipt.gasUsed && receipt.effectiveGasPrice
      ? receipt.gasUsed * receipt.effectiveGasPrice
      : 0n

  return {
    status: receipt.status === 'success' ? 'confirmed' : 'failed',
    transactionHash: receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    totalFeePaidEth: formatUnits(totalFeeWei, 18),
    swaps,
    transfers,
  }
}
