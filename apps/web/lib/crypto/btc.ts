import { HDKey } from '@scure/bip32'
import { bech32 } from '@scure/base'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { mnemonicToSeedSync } from 'bip39'
import { normalizeMnemonic, validateMnemonic } from './bip39'
import { InvalidMnemonicError } from './errors'

/**
 * ============================================================================
 * deriveBtcIdentity(phrase: string): { btcAddress: string }
 * ============================================================================
 * @description Derives a Bitcoin Native SegWit (BIP-84) address from a 12/24 word seed phrase.
 * 
 * Derivation Steps:
 * 1. Mnemonic -> PBKDF2-HMAC-SHA512 -> 64-byte Master Seed.
 * 2. HMAC-SHA512("Bitcoin seed", Seed) -> Master HD Node.
 * 3. Derives child key down BIP-84 path: m/84'/0'/0'/0/0.
 * 4. HASH160(Compressed PubKey) = RIPEMD160(SHA256(PubKey)) -> 20-byte Keyhash.
 * 5. Bech32 Encode (HRP="bc", Witness Version=0, Keyhash) -> "bc1q..." address.
 * 
 * @where_used  apps/web/lib/crypto/vault.ts (inside createAndSaveVault & unlockVault)
 */
export function deriveBtcIdentity(phrase: string): { btcAddress: string } {
  const normalized = normalizeMnemonic(phrase)
  if (!validateMnemonic(normalized)) {
    throw new InvalidMnemonicError('Cannot derive Bitcoin address from invalid mnemonic.')
  }

  // 1. Mnemonic to 64-byte Seed
  const seed = mnemonicToSeedSync(normalized)

  // 2. Master HDKey
  const hdkey = HDKey.fromMasterSeed(seed)

  // 3. Derive BIP-84 Path: m/84'/0'/0'/0/0 (Native SegWit)
  const child = hdkey.derive("m/84'/0'/0'/0/0")

  if (!child.publicKey) {
    throw new Error('Failed to derive public key for Bitcoin path m/84\'/0\'/0\'/0/0')
  }

  // 4. HASH160: RIPEMD160(SHA256(PubKey)) -> 20-byte Witness Program
  const pubKeyHash = ripemd160(sha256(child.publicKey))

  // 5. Bech32 Encode (Witness Version 0 + 20-byte Keyhash)
  const words = [0, ...bech32.toWords(pubKeyHash)]
  const btcAddress = bech32.encode('bc', words)

  return { btcAddress }
}
