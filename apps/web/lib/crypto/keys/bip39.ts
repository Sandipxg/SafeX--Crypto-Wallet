import * as bip39 from 'bip39'
import { generateEntropy } from '../vault/entropy'
import { EntropySize } from '../common/types'
import { InvalidMnemonicError } from '../common/errors'
import { mnemonicToAccount } from 'viem/accounts'

/**
 * ============================================================================
 * 1. normalizeMnemonic(phrase: string): string
 * ============================================================================
 * @description Sanitizes user-entered or pasted seed phrase strings to prevent
 *              checksum verification failures caused by formatting quirks.
 *              - Applies Unicode NFKD normalization (handles foreign accents).
 *              - Trims leading/trailing whitespace.
 *              - Converts all characters to lowercase.
 *              - Collapses consecutive spaces/newlines into a single space.
 *
 * @where_used  - Used internally by validateMnemonic, mnemonicToSeed, and deriveWalletIdentity.
 *              - Called on import forms (onboarding/import/page.tsx) prior to validation.
 *
 * @when_used   Every time a user types, pastes, or processes a 12/24-word seed phrase.
 */
export function normalizeMnemonic(phrase: string): string {
  if (!phrase) return ''
  return phrase
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * ============================================================================
 * 2. generateMnemonic(bits: EntropySize = 128): string
 * ============================================================================
 * @description Generates a brand new BIP39 seed phrase string from secure entropy.
 *              - 128 bits entropy -> 16 bytes -> 12-word seed phrase.
 *              - 256 bits entropy -> 32 bytes -> 24-word seed phrase.
 *              Uses window.crypto.getRandomValues (CSPRNG) via generateEntropy().
 *
 * @where_used  apps/web/app/(auth)/onboarding/create/page.tsx
 *
 * @when_used   During the "Create New Wallet" onboarding wizard when a user chooses
 *              12 words or 24 words to generate a new wallet.
 */
export function generateMnemonic(bits: EntropySize = 128): string {
  const entropy = generateEntropy(bits)
  const entropyHex = Buffer.from(entropy).toString('hex')
  return bip39.entropyToMnemonic(entropyHex)
}

/**
 * ============================================================================
 * 3. validateMnemonic(phrase: string): boolean
 * ============================================================================
 * @description Checks if a given seed phrase is valid according to BIP39 specs.
 *              - Verifies that every word exists in the 2048-word BIP39 dictionary.
 *              - Verifies that the final word's checksum matches the preceding entropy bits.
 *
 * @where_used  - Live input validation on apps/web/app/(auth)/onboarding/import/page.tsx.
 *              - Internal assertion guard inside mnemonicToSeed and deriveWalletIdentity.
 *
 * @when_used   Triggered in real-time as the user types/pastes words during wallet import,
 *              and right before encrypting/saving the seed to IndexedDB.
 */
export function validateMnemonic(phrase: string): boolean {
  const normalized = normalizeMnemonic(phrase)
  if (!normalized) return false
  return bip39.validateMnemonic(normalized)
}

/**
 * ============================================================================
 * 4. mnemonicToSeed(phrase: string, passphrase: string = ''): Uint8Array
 * ============================================================================
 * @description Derives a 512-bit (64-byte) binary Master Seed from a mnemonic phrase.
 *              - Executes 2048 rounds of PBKDF2-HMAC-SHA512 hashing.
 *              - Serves as the root binary seed for all HD key tree derivations (BIP32/BIP44/BIP84).
 *
 * @where_used  apps/web/lib/crypto/vault.ts and multi-chain address derivation utilities.
 *
 * @when_used   When generating multi-chain HD keys (e.g. Bitcoin, Solana, Cosmos)
 *              from the root seed phrase.
 */
export function mnemonicToSeed(phrase: string, passphrase: string = ''): Uint8Array {
  const normalized = normalizeMnemonic(phrase)
  if (!validateMnemonic(normalized)) {
    throw new InvalidMnemonicError('Cannot derive seed from invalid mnemonic phrase.')
  }
  const seedBuffer = bip39.mnemonicToSeedSync(normalized, passphrase)
  return new Uint8Array(seedBuffer)
}

/**
 * ============================================================================
 * 5. deriveWalletIdentity(phrase: string): { address, publicKey }
 * ============================================================================
 * @description Derives the primary EVM wallet identity using Viem's mnemonicToAccount.
 *              - Default HD path: m/44'/60'/0'/0/0 (Ethereum / EVM standard).
 *              - Returns primary public address (0x...) and compressed Secp256k1 public key.
 *
 * @where_used  - apps/web/lib/crypto/vault.ts (inside createAndSaveVault & unlockVault).
 *              - apps/web/lib/store/useVaultStore.ts (sets activeAddress in UI state).
 *              - Backend auth registration (sent to authRouter.registerWallet).
 *
 * @when_used   During wallet creation, wallet import, and whenever the vault is unlocked
 *              to retrieve the active public address for the dashboard and dApp interactions.
 */
export function deriveWalletIdentity(phrase: string): { address: `0x${string}`; publicKey: `0x${string}` } {
  const normalized = normalizeMnemonic(phrase)
  if (!validateMnemonic(normalized)) {
    throw new InvalidMnemonicError('Cannot derive wallet identity from invalid mnemonic phrase.')
  }

  const account = mnemonicToAccount(normalized)
  return {
    address: account.address,
    publicKey: account.publicKey,
  }
}

