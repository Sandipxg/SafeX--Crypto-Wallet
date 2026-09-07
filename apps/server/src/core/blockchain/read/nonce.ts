import { getPublicClient } from '../client/publicClient.js'

export async function getPendingNonce(
  address: string,
  chainId: number = 11155111
): Promise<number> {
  const client = getPublicClient(chainId)
  const nonce = await client.getTransactionCount({
    address: address as `0x${string}`,
    blockTag: 'pending',
  })

  return nonce
}
