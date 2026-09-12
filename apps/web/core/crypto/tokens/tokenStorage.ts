import { CustomTokenRecord } from './tokenTypes'

const DB_NAME = 'safex_tokens_db'
const DB_VERSION = 1
const STORE_NAME = 'custom_tokens'

function openTokensDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Key is combination of chainId_walletAddress_tokenAddress
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('chainId', 'chainId', { unique: false })
        store.createIndex('walletAddress', 'walletAddress', { unique: false })
        store.createIndex('address', 'address', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function buildRecordKey(tokenAddress: string, walletAddress: string, chainId: number): string {
  return `${chainId}_${walletAddress.toLowerCase()}_${tokenAddress.toLowerCase()}`
}

export async function saveCustomToken(token: CustomTokenRecord): Promise<void> {
  const db = await openTokensDb()
  const key = buildRecordKey(token.address, token.walletAddress, token.chainId)

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const record = {
      ...token,
      id: key,
    }
    const request = store.put(record)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getCustomTokens(
  walletAddress: string,
  chainId: number = 11155111
): Promise<CustomTokenRecord[]> {
  const db = await openTokensDb()
  const normalizedWallet = walletAddress.toLowerCase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const all: (CustomTokenRecord & { id: string })[] = request.result || []
      const filtered = all.filter(
        (t) =>
          t.chainId === chainId &&
          t.walletAddress.toLowerCase() === normalizedWallet
      )
      resolve(filtered)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCustomToken(
  tokenAddress: string,
  walletAddress: string,
  chainId: number = 11155111
): Promise<void> {
  const db = await openTokensDb()
  const key = buildRecordKey(tokenAddress, walletAddress, chainId)

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
