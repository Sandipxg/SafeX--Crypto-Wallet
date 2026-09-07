import { getPublicClient } from '../client/publicClient.js'

export interface BroadcastParams {
  signedHex: `0x${string}`
  chainId?: number
}

export async function broadcastRawTransaction(
  params: BroadcastParams
): Promise<`0x${string}`> {
  const { signedHex, chainId = 11155111 } = params

  if (!signedHex || !signedHex.startsWith('0x')) {
    throw new Error('Signed raw transaction hex string is required.')
  }

  const client = getPublicClient(chainId)

  // Broadcast signed EIP-1559 payload to JSON-RPC node
  const txHash = await client.sendRawTransaction({
    serializedTransaction: signedHex,
  })

  return txHash
}
