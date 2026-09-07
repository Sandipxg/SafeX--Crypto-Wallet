export interface ClientTxRecord {
  id: string
  hash: string
  from: `0x${string}`
  to: `0x${string}`
  valueEth: string
  nonce: number
  chainId: number
  status: 'created' | 'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'
  gasUsed?: string
  effectiveGasPrice?: string
  blockNumber?: number
  createdAt: string
  updatedAt: string
}

const DB_NAME = 'safex_tx_db'
const DB_VERSION = 1
const STORE_NAME = 'client_transactions'

function openTxDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' })
        store.createIndex('from', 'from', { unique: false })
        store.createIndex('to', 'to', { unique: false })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('chainId', 'chainId', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveClientTx(tx: ClientTxRecord): Promise<void> {
  const db = await openTxDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(tx)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getClientTxHistory(
  walletAddress: string,
  chainId: number = 11155111
): Promise<ClientTxRecord[]> {
  const db = await openTxDb()
  const normalized = walletAddress.toLowerCase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const all: ClientTxRecord[] = request.result || []
      const filtered = all.filter(
        (tx) =>
          tx.chainId === chainId &&
          (tx.from.toLowerCase() === normalized || tx.to.toLowerCase() === normalized)
      )
      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      resolve(filtered)
    }

    request.onerror = () => reject(request.error)
  })
}

export async function updateClientTxStatus(
  hash: string,
  updates: Partial<ClientTxRecord>
): Promise<void> {
  const db = await openTxDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getReq = store.get(hash)

    getReq.onsuccess = () => {
      const existing: ClientTxRecord | undefined = getReq.result
      if (!existing) {
        resolve()
        return
      }

      const updatedRecord: ClientTxRecord = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      const putReq = store.put(updatedRecord)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }

    getReq.onerror = () => reject(getReq.error)
  })
}

export async function getPendingClientTxs(walletAddress: string): Promise<ClientTxRecord[]> {
  const db = await openTxDb()
  const normalized = walletAddress.toLowerCase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const all: ClientTxRecord[] = request.result || []
      const pending = all.filter(
        (tx) =>
          (tx.status === 'broadcasted' || tx.status === 'pending') &&
          tx.from.toLowerCase() === normalized
      )
      resolve(pending)
    }

    request.onerror = () => reject(request.error)
  })
}
