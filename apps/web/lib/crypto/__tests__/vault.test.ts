import { describe, it, expect } from 'vitest'
import { deriveKeyArgon2id } from '../kdf'
import { encryptAESGCM, decryptAESGCM } from '../aes'
import { InvalidPasswordError } from '../errors'
import { generateEntropy } from '../entropy'

describe('AES-256-GCM & Argon2id Vault Crypto Unit Tests', () => {
  const password = 'TestSecretPassword123!'
  const plaintextMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  const plaintextBytes = new TextEncoder().encode(plaintextMnemonic)

  it('should derive a 256-bit key from password using Argon2id', () => {
    const salt = generateEntropy(16) // 16 bytes
    const key = deriveKeyArgon2id(password, salt)
    expect(key).toBeInstanceOf(Uint8Array)
    expect(key.length).toBe(32) // 256 bits
  })

  it('should encrypt and successfully decrypt plaintext with valid password', async () => {
    const salt = generateEntropy(16)
    const iv = generateEntropy(12)
    const key = deriveKeyArgon2id(password, salt)

    const payload = await encryptAESGCM(plaintextBytes, key, iv)
    expect(payload.ciphertext.length).toBeGreaterThan(0)
    expect(payload.authTag.length).toBe(16) // 128-bit Auth Tag
    expect(payload.iv.length).toBe(12)      // 96-bit IV

    const decryptedBytes = await decryptAESGCM(payload, key)
    const decryptedText = new TextDecoder().decode(decryptedBytes)
    expect(decryptedText).toBe(plaintextMnemonic)
  })

  it('should throw InvalidPasswordError when attempting decryption with wrong password key', async () => {
    const salt = generateEntropy(16)
    const iv = generateEntropy(12)
    const validKey = deriveKeyArgon2id(password, salt)
    const wrongKey = deriveKeyArgon2id('WrongPassword123!', salt)

    const payload = await encryptAESGCM(plaintextBytes, validKey, iv)

    await expect(decryptAESGCM(payload, wrongKey)).rejects.toThrow(InvalidPasswordError)
  })

  it('should throw InvalidPasswordError when auth tag or ciphertext is tampered', async () => {
    const salt = generateEntropy(16)
    const iv = generateEntropy(12)
    const key = generateEntropy(32)

    const payload = await encryptAESGCM(plaintextBytes, key, iv)

    // Tamper with auth tag byte
    const tamperedPayload = {
      ...payload,
      authTag: new Uint8Array(payload.authTag),
    }
    tamperedPayload.authTag[0] ^= 0xff

    await expect(decryptAESGCM(tamperedPayload, key)).rejects.toThrow(InvalidPasswordError)
  })
})
