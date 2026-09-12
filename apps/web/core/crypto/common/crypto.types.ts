export type KdfType = 'argon2id'

export interface VaultRecord {
  version: number
  kdf: KdfType
  memoryCost: number // e.g. 65536 KB (64MB)
  timeCost: number   // e.g. 3 iterations
  salt: Uint8Array   // 16 bytes
  iv: Uint8Array     // 12 bytes
  authTag: Uint8Array // 16 bytes GCM tag
  ciphertext: Uint8Array
  address?: `0x${string}`
  btcAddress?: string
  publicKey?: `0x${string}`
  createdAt: string
  updatedAt: string
}

export type VaultState = 'LOCKED' | 'UNLOCKED'

export type EntropySize = 128 | 256
