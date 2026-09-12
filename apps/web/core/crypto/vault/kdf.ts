import { argon2id } from '@noble/hashes/argon2.js'

export interface KdfParams {
  timeCost?: number
  memoryCost?: number
  parallelism?: number
  dkLen?: number
}

/**
 * Default OWASP-recommended parameters for Argon2id key derivation:
 * - timeCost (t): 3 iterations
 * - memoryCost (m): 65,536 KiB (64 MB)
 * - parallelism (p): 1 thread
 * - dkLen: 32 bytes (256-bit key size required for AES-256-GCM)
 */
export const DEFAULT_ARGON2_PARAMS = {
  timeCost: 3,
  memoryCost: 65536, // 64 MB in KB
  parallelism: 1,
  dkLen: 32, // 256 bits key size for AES-256
}

/**
 * ============================================================================
 * deriveKeyArgon2id(password, salt, params): Uint8Array
 * ============================================================================
 * @description Derives a cryptographically strong 256-bit (32-byte) AES key from
 *              a user password and a 16-byte random salt using Argon2id.
 *              Argon2id is a memory-hard password hashing function designed to
 *              thwart GPU/ASIC brute-force dictionary attacks.
 *
 * @where_used  apps/web/lib/crypto/vault.ts (createAndSaveVault & unlockVault)
 *
 * @when_used   Whenever the user creates a new wallet vault or unlocks their
 *              existing wallet vault with their password.
 */
export function deriveKeyArgon2id(
  password: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_ARGON2_PARAMS
): Uint8Array {
  const passwordBytes = new TextEncoder().encode(password)

  const key = argon2id(passwordBytes, salt, {
    t: params.timeCost ?? DEFAULT_ARGON2_PARAMS.timeCost,
    m: params.memoryCost ?? DEFAULT_ARGON2_PARAMS.memoryCost,
    p: params.parallelism ?? DEFAULT_ARGON2_PARAMS.parallelism,
    dkLen: params.dkLen ?? DEFAULT_ARGON2_PARAMS.dkLen,
  })

  return key
}

