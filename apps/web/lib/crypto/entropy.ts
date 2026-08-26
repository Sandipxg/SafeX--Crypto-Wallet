import { EntropySize } from './types'

/**
 * ============================================================================
 * generateEntropy(bitsOrBytes: EntropySize | number = 128): Uint8Array
 * ============================================================================
 * @description Generates cryptographically secure random entropy bytes (CSPRNG).
 *              Uses OS hardware noise via Web Crypto API (window.crypto.getRandomValues).
 *              Smart parameter handling:
 *              - Inputs > 64 are treated as bit length (e.g. 128 bits -> 16 bytes, 256 bits -> 32 bytes).
 *              - Inputs <= 64 are treated as raw byte length (e.g. 12 bytes for IV, 16 bytes for Salt).
 *
 * @where_used  - apps/web/lib/crypto/bip39.ts (generateMnemonic)
 *              - apps/web/lib/crypto/vault.ts (createAndSaveVault for salt & IV generation)
 *
 * @when_used   During seed phrase generation, password key derivation, and AES encryption.
 */
export function generateEntropy(bitsOrBytes: EntropySize | number = 128): Uint8Array {
  // If argument is <= 64, treat as byte length. If > 64, treat as bit length (e.g., 128 -> 16 bytes, 256 -> 32 bytes)
  const byteLength = bitsOrBytes <= 64 ? bitsOrBytes : Math.ceil(bitsOrBytes / 8)
  const entropy = new Uint8Array(byteLength)

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(entropy)
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(entropy)
  } else {
    // Node.js fallback using standard 'crypto' specifier (without 'node:' scheme for Webpack compatibility)
    const cryptoModule = require('crypto')
    const randomBytes = cryptoModule.randomBytes(byteLength)
    entropy.set(randomBytes)
  }

  return entropy
}

