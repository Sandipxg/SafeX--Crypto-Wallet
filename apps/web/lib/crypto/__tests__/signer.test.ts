import { describe, it, expect } from 'vitest'
import { serializeUnsignedEip1559Payload } from '../index'
import { parseEther } from 'viem'

describe('Client EIP-1559 Serializer Tests', () => {
  it('should construct valid RLP serialized EIP-1559 transaction bytes', () => {
    const unsignedHex = serializeUnsignedEip1559Payload({
      chainId: 11155111,
      nonce: 5,
      to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      valueEth: '0.1',
      gasLimit: 21000n,
      maxFeePerGas: parseEther('0.000000035'), // 35 Gwei
      maxPriorityFeePerGas: parseEther('0.000000002'), // 2 Gwei
    })

    expect(unsignedHex).toBeDefined()
    expect(unsignedHex.startsWith('0x02')).toBe(true) // EIP-1559 Type-2 Envelope header
  })
})
