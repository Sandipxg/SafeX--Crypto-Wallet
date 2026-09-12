import { generateEntropy } from './entropy'
import { deriveKeyArgon2id, DEFAULT_ARGON2_PARAMS } from './kdf'
import { encryptAESGCM, decryptAESGCM } from './aes'
import { saveVaultRecord, loadVaultRecord, deleteVaultRecord } from './vaultStorage'
import { VaultRecord } from '../common/crypto.types'
import { normalizeMnemonic, validateMnemonic, deriveWalletIdentity } from '../keys/bip39'
import { deriveBtcIdentity } from '../keys/btc'
import { InvalidMnemonicError, InvalidPasswordError } from '../common/errors'
import { zeroizeBuffer } from './memory'

/**
 * ============================================================================
 * 1. createAndSaveVault(password, mnemonic): Promise<{ address, btcAddress, publicKey }>
 * ============================================================================
 * @description Master onboarding pipeline:
 *              1. Validates mnemonic phrase via bip39.ts.
 *              2. Generates 16-byte salt & 12-byte IV via entropy.ts.
 *              3. Derives 256-bit AES key from password via Argon2id (kdf.ts).
 *              4. Encrypts mnemonic via AES-256-GCM (aes.ts).
 *              5. Saves VaultRecord ({ salt, iv, authTag, ciphertext }) to IndexedDB (storage.ts).
 *              6. Derives primary EVM address (bip39.ts) & Bitcoin address (btc.ts).
 *              7. Zeroizes secret key buffers from RAM (memory.ts).
 *
 * @where_used  onboarding/create/page.tsx & onboarding/import/page.tsx
 *
 * @when_used   During initial wallet setup or seed phrase import.
 */
export async function createAndSaveVault(
  password: string,
  mnemonic: string
): Promise<{ address: `0x${string}`; btcAddress: string; publicKey: `0x${string}` }> {
  const normalizedMnemonic = normalizeMnemonic(mnemonic)
  if (!validateMnemonic(normalizedMnemonic)) {
    throw new InvalidMnemonicError('Cannot create vault with invalid mnemonic.')
  }

  if (!password || password.length < 6) {
    throw new InvalidPasswordError('Password must be at least 6 characters long.')
  }

  const salt = generateEntropy(16) // 16 bytes salt
  const iv = generateEntropy(12)   // 12 bytes IV for GCM

  const derivedKey = deriveKeyArgon2id(password, salt)
  const plaintext = new TextEncoder().encode(normalizedMnemonic)

  try {
    const encryptedPayload = await encryptAESGCM(plaintext, derivedKey, iv)

    const walletIdentity = deriveWalletIdentity(normalizedMnemonic)
    const { btcAddress } = deriveBtcIdentity(normalizedMnemonic)

    const record: VaultRecord = {
      version: 1,
      kdf: 'argon2id',
      memoryCost: DEFAULT_ARGON2_PARAMS.memoryCost,
      timeCost: DEFAULT_ARGON2_PARAMS.timeCost,
      salt,
      iv: encryptedPayload.iv,
      authTag: encryptedPayload.authTag,
      ciphertext: encryptedPayload.ciphertext,
      address: walletIdentity.address,
      btcAddress,
      publicKey: walletIdentity.publicKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await saveVaultRecord(record)

    return {
      address: walletIdentity.address,
      btcAddress,
      publicKey: walletIdentity.publicKey,
    }
  } finally {
    zeroizeBuffer(derivedKey)
    zeroizeBuffer(plaintext)
  }
}

/**
 * ============================================================================
 * 2. unlockVault(password): Promise<{ mnemonic, address, btcAddress, publicKey }>
 * ============================================================================
 * @description Master vault unlocking pipeline:
 *              1. Loads stored VaultRecord from IndexedDB (storage.ts).
 *              2. Re-derives Argon2id AES key from password + stored salt (kdf.ts).
 *              3. Decrypts payload & verifies GCM Auth Tag (aes.ts).
 *                 Throws InvalidPasswordError if password wrong or file tampered.
 *              4. Derives EVM address & BTC address & returns decrypted mnemonic string.
 *              5. Zeroizes derived key buffer from RAM (memory.ts).
 *
 * @where_used  Unlock screen & settings/page.tsx (Reveal Seed modal)
 * @when_used   Whenever the user unlocks their wallet with their password.
 */
export async function unlockVault(
  password: string
): Promise<{ mnemonic: string; address: `0x${string}`; btcAddress: string; publicKey: `0x${string}` }> {
  const record = await loadVaultRecord()
  if (!record) {
    throw new InvalidPasswordError('No vault found in storage.')
  }

  const derivedKey = deriveKeyArgon2id(password, record.salt, {
    memoryCost: record.memoryCost,
    timeCost: record.timeCost,
  })

  let decryptedBytes: Uint8Array | null = null

  try {
    decryptedBytes = await decryptAESGCM(
      {
        iv: record.iv,
        authTag: record.authTag,
        ciphertext: record.ciphertext,
      },
      derivedKey
    )

    const mnemonic = new TextDecoder().decode(decryptedBytes)
    const walletIdentity = deriveWalletIdentity(mnemonic)
    const { btcAddress } = deriveBtcIdentity(mnemonic)

    // Auto-upgrade legacy VaultRecord in IndexedDB with public addresses
    if (!record.address || !record.btcAddress) {
      record.address = walletIdentity.address
      record.btcAddress = btcAddress
      record.publicKey = walletIdentity.publicKey
      await saveVaultRecord(record)
    }

    return {
      mnemonic,
      address: walletIdentity.address,
      btcAddress,
      publicKey: walletIdentity.publicKey,
    }
  } finally {
    zeroizeBuffer(derivedKey)
    if (decryptedBytes) {
      zeroizeBuffer(decryptedBytes)
    }
  }
}

/**
 * ============================================================================
 * 3. hasVault(): Promise<boolean>
 * ============================================================================
 * @description Checks if a vault record exists in local IndexedDB storage.
 *
 * @where_used  App routing / splash screen.
 *
 * @when_used   On initial page load to determine whether to show Onboarding or Dashboard.
 */
export async function hasVault(): Promise<boolean> {
  try {
    const record = await loadVaultRecord()
    return record !== null
  } catch {
    return false
  }
}

/**
 * ============================================================================
 * 4. destroyVault(): Promise<void>
 * ============================================================================
 * @description Wipes local vault record from IndexedDB storage.
 *
 * @where_used  Settings / wallet reset buttons.
 *
 * @when_used   When user explicitly resets or deletes local wallet data.
 */
export async function destroyVault(): Promise<void> {
  await deleteVaultRecord()
}

