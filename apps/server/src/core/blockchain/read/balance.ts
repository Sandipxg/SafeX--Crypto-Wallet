import { formatEther } from 'viem'
import { getPublicClient } from '../client/publicClient.js'

export interface BalanceResult {
  address: string
  wei: string
  formattedEth: string
  chainId: number
}

export async function getBalance(
  address: string,
  chainId: number = 11155111
): Promise<BalanceResult> {
  const client = getPublicClient(chainId)
  const balanceWei = await client.getBalance({
    address: address as `0x${string}`,
  })

  return {
    address,
    wei: balanceWei.toString(),
    formattedEth: formatEther(balanceWei),
    chainId,
  }
}
