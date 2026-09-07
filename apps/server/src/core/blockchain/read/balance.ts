import { formatEther } from 'viem'
import { publicClient } from '../client/publicClient.js'

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
  const balanceWei = await publicClient.getBalance({
    address: address as `0x${string}`,
  })

  return {
    address,
    wei: balanceWei.toString(),
    formattedEth: formatEther(balanceWei),
    chainId,
  }
}
