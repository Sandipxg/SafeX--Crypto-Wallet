import { InvalidPasswordError } from '../common/errors'

export interface EncryptedPayload {
  iv: Uint8Array
  authTag: Uint8Array
  ciphertext: Uint8Array
}

/**
 * ============================================================================
 * 1. getSubtleCrypto(): SubtleCrypto
 * ============================================================================
 * @description Helper function to safely retrieve Web Crypto API subtle object
 *              across Browser DOM, Web Workers, and Node.js runtime environments.
 */
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle
  }
  // Fallback for older Node environments without 'node:' scheme for Webpack compatibility
  const cryptoModule = require('crypto')
  return (cryptoModule.webcrypto?.subtle || cryptoModule.subtle) as SubtleCrypto
}

/**
 * ============================================================================
 * 2. encryptAESGCM(plaintext, derivedKey, iv): Promise<EncryptedPayload>
 * ============================================================================
 * @description Encrypts raw plaintext bytes using AES-256-GCM.
 *              - Imports 256-bit Argon2id key into Web Crypto API.
 *              - Applies 12-byte IV for non-repeating counter mode encryption.
 *              - Extracts and returns separate iv, ciphertext, and 16-byte authTag.
 *
 * @where_used  apps/web/lib/crypto/vault.ts (createAndSaveVault)
 *
 * @when_used   During initial wallet creation or seed phrase import when saving
 *              the encrypted vault payload into IndexedDB.
 */
export async function encryptAESGCM(
  plaintext: Uint8Array,
  derivedKey: Uint8Array,
  iv: Uint8Array
): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto()

  const cryptoKey = await subtle.importKey(
    'raw',
    derivedKey as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    cryptoKey,
    plaintext as unknown as BufferSource
  )

  const encryptedBytes = new Uint8Array(encryptedBuffer)
  // Web Crypto AES-GCM appends 16-byte Auth Tag to the end of the ciphertext
  const tagLength = 16
  const ciphertextLength = encryptedBytes.length - tagLength

  const ciphertext = encryptedBytes.slice(0, ciphertextLength)
  const authTag = encryptedBytes.slice(ciphertextLength)

  return {
    iv,
    authTag,
    ciphertext,
  }
}

/**
 * ============================================================================
 * 3. decryptAESGCM(payload, derivedKey): Promise<Uint8Array>
 * ============================================================================
 * @description Decrypts AES-256-GCM payload and verifies the 16-byte Auth Tag.
 *              - Re-combines ciphertext and authTag.
 *              - Verifies integrity tag; if tampered or wrong password -> throws InvalidPasswordError.
 *
 * @where_used  apps/web/lib/crypto/vault.ts (unlockVault)
 *
 * @when_used   Whenever the user unlocks their wallet vault with their password.
 */
export async function decryptAESGCM(
  payload: EncryptedPayload,
  derivedKey: Uint8Array
): Promise<Uint8Array> {
  const subtle = getSubtleCrypto()

  try {
    const cryptoKey = await subtle.importKey(
      'raw',
      derivedKey as unknown as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // Recombine ciphertext and authTag for Web Crypto API decrypt
    const ciphertextAndTag = new Uint8Array(payload.ciphertext.length + payload.authTag.length)
    ciphertextAndTag.set(payload.ciphertext, 0)
    ciphertextAndTag.set(payload.authTag, payload.ciphertext.length)

    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: payload.iv as unknown as BufferSource },
      cryptoKey,
      ciphertextAndTag as unknown as BufferSource
    )

    return new Uint8Array(decryptedBuffer)
  } catch (error) {
    throw new InvalidPasswordError('Failed to decrypt vault. Incorrect password or tampered ciphertext.')
  }
}

/*
 ============================================================================
 📘 REVISION NOTES & DETAILED ARCHITECTURAL GUIDE FOR AES-256-GCM (aes.ts)
 ============================================================================

 1. WHAT DOES THIS FILE DO IN 1 SENTENCE?
    aes.ts is the lock & key engine: it locks your secret seed phrase into scrambled
    bytes using your password key, and unlocks that gibberish back into your seed phrase.

 ----------------------------------------------------------------------------
 2. THE 3 INPUTS GIVEN TO AES-256-GCM ENCRYPTION (encryptAESGCM)
 ----------------------------------------------------------------------------
   [1] plaintext (Uint8Array):
       - What it is: The raw normalized seed phrase converted into 8-bit UTF-8 byte numbers
         using `TextEncoder().encode(normalizedMnemonic)`.
       - Preparation: Cleaned via `normalizeMnemonic` (trims spaces, converts to lowercase,
         unifies unicode accents), then encoded into a UTF-8 binary array:
         [97, 98, 97, 110, 100, 111, 110, 32, ...] ("abandon abandon...")
       - Size: Dynamic byte length matching the string length (e.g. ~65 bytes for 12 words).

   [2] derivedKey (Uint8Array):
       - What it is: The 256-bit (32-byte) secret key derived from your password using Argon2id (kdf.ts).
       - Preparation: `deriveKeyArgon2id` mixes the password with a 16-byte random salt (entropy.ts)
         and allocates 64 MB of RAM across 3 compute passes to derive a unique 32-byte array:
         [241, 12, 88, 99, 150, ..., 32 bytes total].
       - Size: Fixed at 32 bytes (256 bits), mandatory for AES-256 key import.

   [3] iv - Initialization Vector (Uint8Array):
       - What it is: A 96-bit (12-byte) CSPRNG random number generated fresh for every encryption
         call using `generateEntropy(12)` in entropy.ts.
       - Purpose: Randomizes Counter (CTR) mode encryption so that encrypting the exact same
         seed phrase twice produces 100% completely different scrambled byte outputs every time.
       - Size: Fixed at 12 bytes (96 bits), the standard recommended size for AES-GCM.

 ----------------------------------------------------------------------------
 3. THE 3 OUTPUTS RETURNED INSIDE EncryptedPayload
 ----------------------------------------------------------------------------
   [4] ciphertext (Uint8Array):
       - What it is: The encrypted, unreadable binary byte representation of the seed phrase.
       - Detail: Computed by XORing plaintext bytes with AES counter keystream blocks.
         Without the 32-byte Argon2id key, ciphertext is mathematically indistinguishable
         from pure random noise: [142, 29, 204, 88, 12, ...].
       - Size: Equal in byte length to the input plaintext (e.g. ~65 bytes).

   [5] authTag - Authentication Tag / Tamper Seal (Uint8Array):
       - What it is: A 16-byte (128-bit) Message Authentication Code (MAC) generated by
         Galois Field (GF(2^128)) GHASH polynomial multiplication over the ciphertext bytes.
       - Detail: Acts as a tamper-proof digital security seal. During decryption (decryptAESGCM),
         AES recalculates this tag. If a hacker or virus alters even 1 bit of the stored payload
         in IndexedDB, the tag fails and decryption aborts immediately with InvalidPasswordError.
       - Size: Fixed at 16 bytes (128 bits).

   [6] iv - Initialization Vector (Uint8Array):
       - What it is: The exact 12-byte random IV that was passed into the encryption function.
       - Detail: Returned alongside ciphertext and authTag so all 3 components can be saved
         together inside VaultRecord in IndexedDB (safex_db). Decryption strictly requires
         the exact same 12-byte IV used during encryption.
       - Size: Fixed at 12 bytes (96 bits).

 ----------------------------------------------------------------------------
 4. HOW DECRYPTION WORKS (decryptAESGCM):
 ----------------------------------------------------------------------------
    - Accepts EncryptedPayload { iv, authTag, ciphertext } + Argon2id Password Key.
    - Re-attaches authTag to ciphertext and passes payload + iv to Web Crypto subtle.decrypt.
    - Checks:
        * Is the password key correct?
        * Is the 16-byte authTag seal intact?
    - If YES -> Returns original plaintext seed phrase bytes ("abandon abandon...").
    - If NO  -> Throws InvalidPasswordError immediately!
 ============================================================================
*/


