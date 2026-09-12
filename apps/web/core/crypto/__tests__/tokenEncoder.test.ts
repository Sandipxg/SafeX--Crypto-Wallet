import { describe, it, expect } from 'vitest'
import {
  encodeTokenTransfer,
  encodeTokenApprove,
  encodeTokenTransferFrom,
} from '../tokens/tokenEncoder'
import { getVerifiedTokensForChain } from '../tokens/tokenRegistry'

describe('Token Calldata Encoder & Registry', () => {
  const dummyRecipient = '0x1111111111111111111111111111111111111111'
  const dummySender = '0x2222222222222222222222222222222222222222'
  const dummyAmount = 1000000n

  it('correctly encodes ERC-20 transfer calldata with 0xa9059cbb selector', () => {
    const calldata = encodeTokenTransfer(dummyRecipient, dummyAmount)
    expect(calldata).toBeDefined()
    expect(calldata.startsWith('0xa9059cbb')).toBe(true)
    // 4 bytes selector + 32 bytes recipient + 32 bytes amount = 68 bytes = 138 hex chars (including 0x)
    expect(calldata.length).toBe(138)
  })

  it('correctly encodes ERC-20 approve calldata with 0x095ea7b3 selector', () => {
    const calldata = encodeTokenApprove(dummyRecipient, dummyAmount)
    expect(calldata).toBeDefined()
    expect(calldata.startsWith('0x095ea7b3')).toBe(true)
    expect(calldata.length).toBe(138)
  })

  it('correctly encodes ERC-20 transferFrom calldata with 0x23b872dd selector', () => {
    const calldata = encodeTokenTransferFrom(dummySender, dummyRecipient, dummyAmount)
    expect(calldata).toBeDefined()
    expect(calldata.startsWith('0x23b872dd')).toBe(true)
    // 4 bytes selector + 32 bytes sender + 32 bytes recipient + 32 bytes amount = 100 bytes = 202 hex chars
    expect(calldata.length).toBe(202)
  })

  it('returns verified tokens for Sepolia testnet (11155111)', () => {
    const tokens = getVerifiedTokensForChain(11155111)
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.some((t) => t.symbol === 'USDC')).toBe(true)
    expect(tokens.some((t) => t.symbol === 'LINK')).toBe(true)
  })

  it('returns verified tokens for Ethereum Mainnet (1)', () => {
    const tokens = getVerifiedTokensForChain(1)
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.some((t) => t.symbol === 'USDC')).toBe(true)
    expect(tokens.some((t) => t.symbol === 'USDT')).toBe(true)
  })

  it('falls back gracefully to Sepolia tokens for unsupported chains', () => {
    const tokens = getVerifiedTokensForChain(999999)
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.some((t) => t.symbol === 'USDC')).toBe(true)
  })
})
