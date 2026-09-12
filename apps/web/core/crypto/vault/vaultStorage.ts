import { VaultRecord } from '../common/crypto.types'
import { CorruptedVaultError } from '../common/errors'

/**
 * IndexedDB Configuration Constants:
 * - DB_NAME: 'safex_db'
 * - STORE_NAME: 'vault_store'
 * - VAULT_KEY: 'primary_vault'
 */
const DB_NAME = 'safex_db'
const DB_VERSION = 1
const STORE_NAME = 'vault_store'
const VAULT_KEY = 'primary_vault'

/**
 * ============================================================================
 * 1. openDB(): Promise<IDBDatabase>
 * ============================================================================
 * @description Helper function that opens/initializes the browser's IndexedDB.
 *              Wraps legacy event callbacks in a clean async Promise.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * ============================================================================
 * 2. saveVaultRecord(record: VaultRecord): Promise<void>
 * ============================================================================
 * @description Writes a versioned VaultRecord to IndexedDB.
 *              Stores raw Uint8Array binary fields (salt, iv, authTag, ciphertext)
 *              without main thread blocking.
 *
 * @where_used  apps/web/lib/crypto/vault.ts (createAndSaveVault)
 *
 * @when_used   During new wallet creation or seed phrase import.
 */
export async function saveVaultRecord(record: VaultRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(record, VAULT_KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * ============================================================================
 * 3. loadVaultRecord(): Promise<VaultRecord | null>
 * ============================================================================
 * @description Asynchronously retrieves the VaultRecord from IndexedDB.
 *              Validates integrity of required binary fields; throws CorruptedVaultError
 *              if fields are missing. Returns null if no vault exists.
 *
 * @where_used  apps/web/lib/crypto/vault.ts (unlockVault & hasVault)
 *
 * @when_used   On app startup (to check if user has a wallet) and during password unlock.
 */
export async function loadVaultRecord(): Promise<VaultRecord | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(VAULT_KEY)

    request.onsuccess = () => {
      const record = request.result as VaultRecord | undefined
      if (!record) {
        resolve(null)
        return
      }

      // Basic integrity validation
      if (!record.salt || !record.iv || !record.authTag || !record.ciphertext) {
        reject(new CorruptedVaultError('Stored vault record is missing required cryptographic fields.'))
        return
      }

      resolve(record)
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * ============================================================================
 * 4. deleteVaultRecord(): Promise<void>
 * ============================================================================
 * @description Permanently deletes the stored VaultRecord from IndexedDB.
 *
 * @where_used  Wallet reset flows.
 *
 * @when_used   When a user explicitly deletes/resets their local wallet vault.
 */
export async function deleteVaultRecord(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(VAULT_KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

