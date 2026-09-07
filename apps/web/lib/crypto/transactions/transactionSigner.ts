import { mnemonicToAccount } from 'viem/accounts'
import { loadVaultRecord } from '../vault/vaultStorage'
import { deriveKeyArgon2id } from '../vault/kdf'
import { decryptAESGCM } from '../vault/aes'
import { zeroizeBuffer } from '../vault/memory'
import { InvalidPasswordError } from '../common/errors'
import { prepareUnsignedTransaction, UnsignedEip1559Request } from './transactionSerializer'

export interface SignTransactionParams {
  password: string
  txRequest: UnsignedEip1559Request
}

export interface SignTransactionResult {
  signedHex: `0x${string}`
  senderAddress: `0x${string}`
}

/**
 * ============================================================================
 * signEip1559Transaction({ password, txRequest }): Promise<SignTransactionResult>
 * ============================================================================
 * @description Zero-trust offline transaction signer:
 *              1. Loads encrypted vault from IndexedDB storage.
 *              2. Re-derives Argon2id AES key from password + salt in RAM.
 *              3. Decrypts seed phrase in RAM.
 *              4. Derives EVM private key & account.
 *              5. Signs EIP-1559 payload offline (returns 0x02f8... bytes).
 *              6. IMMEDIATELY zeroizes all secret key buffers & mnemonic memory.
 *              7. Returns signed raw transaction hex string.
 *
 * @security    Private keys and seed phrases NEVER leave RAM and NEVER leave client.
 */
export async function signEip1559Transaction(
  params: SignTransactionParams
): Promise<SignTransactionResult> {
  const { password, txRequest } = params

  const record = await loadVaultRecord()
  if (!record) {
    throw new InvalidPasswordError('No encrypted vault found in storage.')
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
    const account = mnemonicToAccount(mnemonic)

    const preparedTx = prepareUnsignedTransaction(txRequest)
    const signedHex = await account.signTransaction(preparedTx)

    return {
      signedHex,
      senderAddress: account.address,
    }
  } finally {
    // ZERO-TRUST SECURITY: Zeroize secret buffers immediately
    zeroizeBuffer(derivedKey)
    if (decryptedBytes) {
      zeroizeBuffer(decryptedBytes)
    }
  }
}
