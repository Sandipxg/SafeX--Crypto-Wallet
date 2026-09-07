import { describe, it, expect } from 'vitest'
import { ClientTxRecord } from '../index'

describe('Client-Side Local Database Type Schema Tests', () => {
  it('should construct valid ClientTxRecord objects for local IndexedDB storage', () => {
    const record: ClientTxRecord = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      hash: '0x8b1b2db6d4d74e1234567890abcdef1234567890abcdef1234567890abcdef12',
      from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      to: '0x1234567890123456789012345678901234567890',
      valueEth: '0.01',
      nonce: 4,
      chainId: 11155111,
      status: 'broadcasted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    expect(record.hash).toBeDefined()
    expect(record.chainId).toBe(11155111)
    expect(record.status).toBe('broadcasted')
  })
})
