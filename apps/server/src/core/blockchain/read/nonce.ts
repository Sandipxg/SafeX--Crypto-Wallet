import { publicClient } from '../client/publicClient.js'

export async function getPendingNonce(
  address: string,
  _chainId: number = 11155111
): Promise<number> {
  const nonce = await publicClient.getTransactionCount({
    address: address as `0x${string}`,
    blockTag: 'pending',
  })

  return nonce
}
