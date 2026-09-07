import { publicClient } from '../client/publicClient.js'

export interface BroadcastParams {
  signedHex: `0x${string}`
}

export async function broadcastRawTransaction(
  params: BroadcastParams
): Promise<`0x${string}`> {
  const { signedHex } = params

  if (!signedHex || !signedHex.startsWith('0x')) {
    throw new Error('Signed raw transaction hex string is required.')
  }

  // Broadcast signed EIP-1559 payload to Sepolia JSON-RPC node
  const txHash = await publicClient.sendRawTransaction({
    serializedTransaction: signedHex,
  })

  return txHash
}
