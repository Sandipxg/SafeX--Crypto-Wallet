import { describe, it, expect } from 'vitest'
import { generateMnemonic, validateMnemonic, normalizeMnemonic, mnemonicToSeed, deriveWalletIdentity } from '../index'

describe('BIP39 Cryptographic Utilities', () => {
  it('should generate a valid 12-word mnemonic phrase (128-bit entropy)', () => {
    const mnemonic = generateMnemonic(128)
    expect(mnemonic).toBeDefined()
    const words = mnemonic.split(' ')
    expect(words.length).toBe(12)
    expect(validateMnemonic(mnemonic)).toBe(true)
  })

  it('should generate a valid 24-word mnemonic phrase (256-bit entropy)', () => {
    const mnemonic = generateMnemonic(256)
    expect(mnemonic).toBeDefined()
    const words = mnemonic.split(' ')
    expect(words.length).toBe(24)
    expect(validateMnemonic(mnemonic)).toBe(true)
  })

  it('should normalize input whitespace and casing correctly', () => {
    const dirty = '  ABANDON  abandon   abandon abandon abandon abandon abandon abandon abandon abandon abandon ABOUT  '
    const normalized = normalizeMnemonic(dirty)
    expect(normalized).toBe('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
    expect(validateMnemonic(dirty)).toBe(true)
  })

  it('should reject invalid mnemonic checksums or words', () => {
    const invalidWord = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon zebra'
    expect(validateMnemonic(invalidWord)).toBe(false)

    const truncated = 'abandon abandon abandon'
    expect(validateMnemonic(truncated)).toBe(false)
  })

  it('should derive consistent 512-bit seed and EVM address for official test vector', () => {
    // Official BIP39 Vector 1: 12 words ending in about
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    expect(validateMnemonic(mnemonic)).toBe(true)

    const seed = mnemonicToSeed(mnemonic)
    expect(seed).toBeInstanceOf(Uint8Array)
    expect(seed.length).toBe(64) // 512 bits

    const identity = deriveWalletIdentity(mnemonic)
    expect(identity.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(identity.publicKey).toMatch(/^0x[a-fA-F0-9]{130}$/)
  })
})
