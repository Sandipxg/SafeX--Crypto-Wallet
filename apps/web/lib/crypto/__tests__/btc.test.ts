import { describe, it, expect } from 'vitest'
import { deriveBtcIdentity } from '../index'

describe('Bitcoin Native SegWit (BIP-84) Derivation', () => {
  it('should derive a valid Native SegWit bc1q... address for official BIP39 vector', () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    const { btcAddress } = deriveBtcIdentity(mnemonic)
    
    expect(btcAddress).toBeDefined()
    expect(btcAddress.startsWith('bc1q')).toBe(true)
    expect(btcAddress.length).toBe(42) // Standard Bech32 Native SegWit (p2wpkh) length
    expect(btcAddress).toBe('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu')
  })

  it('should throw InvalidMnemonicError for invalid mnemonic phrase', () => {
    const invalidMnemonic = 'abandon abandon abandon invalid phrase'
    expect(() => deriveBtcIdentity(invalidMnemonic)).toThrow()
  })
})
