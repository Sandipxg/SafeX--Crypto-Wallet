import { parseEther } from 'viem'
import { getPublicClient } from '../client/publicClient.js'
import { validateEvmAddress } from '../utils/address.js'

export interface GasEstimateResult {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  estimatedGasUnits: string
  estimatedTotalFeeWei: string
  chainId: number
}

export async function estimateGasFees(
  from: string,
  to: string,
  valueEth: string = '0',
  data: `0x${string}` = '0x',
  chainId: number = 11155111
): Promise<GasEstimateResult> {
  const validFrom = validateEvmAddress(from)
  const validTo = validateEvmAddress(to)
  const valueWei = parseEther(valueEth || '0')
  const client = getPublicClient(chainId)

  // Fetch current network EIP-1559 base fee + priority tip estimate
  const fees = await client.estimateFeesPerGas()

  // Simulate EVM dry-run execution to estimate required gas units
  let gasUnits: bigint
  try {
    gasUnits = await client.estimateGas({
      account: validFrom,
      to: validTo,
      value: valueWei,
      data,
    })
  } catch {
    // If dry-run fails (e.g. low balance or simulation block), standard native transfers always consume 21,000 gas units
    if (data === '0x' || !data) {
      gasUnits = 21000n
    } else {
      gasUnits = 100000n
    }
  }

  const maxFee = fees.maxFeePerGas ?? 35000000000n
  const priorityFee = fees.maxPriorityFeePerGas ?? 2000000000n
  const totalFeeWei = gasUnits * maxFee

  return {
    maxFeePerGas: maxFee.toString(),
    maxPriorityFeePerGas: priorityFee.toString(),
    estimatedGasUnits: gasUnits.toString(),
    estimatedTotalFeeWei: totalFeeWei.toString(),
    chainId,
  }
}
