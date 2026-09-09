import { create } from 'zustand'
import { VaultState, unlockVault, destroyVault, loadVaultRecord } from '../crypto'

interface VaultStoreState {
  vaultState: VaultState
  hasVaultInStorage: boolean
  decryptedMnemonic: string | null
  activeAddress: `0x${string}` | null
  activeBtcAddress: string | null
  activePublicKey: `0x${string}` | null
  activeChainId: 1 | 11155111
  autoLockTimeoutId: NodeJS.Timeout | number | null

  // Actions
  checkVaultExists: () => Promise<boolean>
  unlock: (password: string) => Promise<void>
  lock: () => void
  setActiveChainId: (chainId: 1 | 11155111) => void
  setSessionCredentials: (address: `0x${string}`, btcAddress: string, publicKey: `0x${string}`, mnemonic?: string) => void
  resetAutoLockTimer: () => void
  wipeVault: () => Promise<void>
}

/**
 * Auto-Lock Duration: 10 minutes (600,000 milliseconds)
 */
const AUTO_LOCK_MS = 10 * 60 * 1000
const SESSION_STORAGE_KEY = 'safex_ephemeral_vault_session'

interface EphemeralSessionPayload {
  mnemonic: string
  address: `0x${string}`
  btcAddress: string
  publicKey: `0x${string}`
  expiresAt: number
}

const saveSessionToStorage = (payload: Omit<EphemeralSessionPayload, 'expiresAt'>, ttlMs = AUTO_LOCK_MS): void => {
  if (typeof window === 'undefined') return
  try {
    const sessionData: EphemeralSessionPayload = {
      ...payload,
      expiresAt: Date.now() + ttlMs,
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
  } catch {
    // sessionStorage restriction fallback
  }
}

const getSessionFromStorage = (): EphemeralSessionPayload | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed: EphemeralSessionPayload = JSON.parse(raw)
    if (!parsed || !parsed.expiresAt || Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const touchSessionInStorage = (ttlMs = AUTO_LOCK_MS): void => {
  if (typeof window === 'undefined') return
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return
    const parsed: EphemeralSessionPayload = JSON.parse(raw)
    if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt) {
      parsed.expiresAt = Date.now() + ttlMs
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed))
    }
  } catch {
    // fallback
  }
}

const clearSessionFromStorage = (): void => {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // fallback
  }
}

/**
 * ============================================================================
 * useVaultStore (Zustand Store)
 * ============================================================================
 * @description In-RAM state store for managing client wallet lock status,
 *              active EVM & Bitcoin wallet addresses, decrypted seed phrase string,
 *              and the 10-minute auto-lock security timer with tab session survival.
 */
export const useVaultStore = create<VaultStoreState>((set, get) => ({
  vaultState: 'LOCKED',
  hasVaultInStorage: false,
  decryptedMnemonic: null,
  activeAddress: null,
  activeBtcAddress: null,
  activePublicKey: null,
  activeChainId: 11155111,
  autoLockTimeoutId: null,

  setActiveChainId: (chainId: 1 | 11155111): void => {
    set({ activeChainId: chainId })
  },

  checkVaultExists: async (): Promise<boolean> => {
    const record = await loadVaultRecord()
    const exists = !!record

    if (record) {
      // Check if we have an active tab session in sessionStorage
      const session = getSessionFromStorage()
      if (session && record.address && session.address.toLowerCase() === record.address.toLowerCase()) {
        const remainingTime = Math.max(1000, session.expiresAt - Date.now())

        const currentTimer = get().autoLockTimeoutId
        if (currentTimer) clearTimeout(currentTimer)

        const timer = setTimeout(() => {
          get().lock()
        }, remainingTime)

        set({
          hasVaultInStorage: true,
          vaultState: 'UNLOCKED',
          decryptedMnemonic: session.mnemonic,
          activeAddress: session.address,
          activeBtcAddress: session.btcAddress,
          activePublicKey: session.publicKey,
          autoLockTimeoutId: timer,
        })
        return true
      }

      const isUnlocked = get().vaultState === 'UNLOCKED'
      set({
        hasVaultInStorage: true,
        activeAddress: isUnlocked ? (record.address || get().activeAddress) : null,
        activeBtcAddress: isUnlocked ? (record.btcAddress || get().activeBtcAddress) : null,
        activePublicKey: isUnlocked ? (record.publicKey || get().activePublicKey) : null,
      })
    } else {
      clearSessionFromStorage()
      set({
        hasVaultInStorage: false,
        activeAddress: null,
        activeBtcAddress: null,
        activePublicKey: null,
      })
    }
    return exists
  },

  unlock: async (password: string): Promise<void> => {
    const { mnemonic, address, btcAddress, publicKey } = await unlockVault(password)

    const currentTimer = get().autoLockTimeoutId
    if (currentTimer) clearTimeout(currentTimer)

    // Save session to tab storage
    saveSessionToStorage({ mnemonic, address, btcAddress, publicKey })

    const timer = setTimeout(() => {
      get().lock()
    }, AUTO_LOCK_MS)

    set({
      vaultState: 'UNLOCKED',
      decryptedMnemonic: mnemonic,
      activeAddress: address,
      activeBtcAddress: btcAddress,
      activePublicKey: publicKey,
      hasVaultInStorage: true,
      autoLockTimeoutId: timer,
    })
  },

  setSessionCredentials: (
    address: `0x${string}`,
    btcAddress: string,
    publicKey: `0x${string}`,
    mnemonic?: string
  ): void => {
    const currentTimer = get().autoLockTimeoutId
    if (currentTimer) clearTimeout(currentTimer)

    if (mnemonic) {
      saveSessionToStorage({ mnemonic, address, btcAddress, publicKey })
    } else {
      clearSessionFromStorage()
    }

    const timer = setTimeout(() => {
      get().lock()
    }, AUTO_LOCK_MS)

    set({
      vaultState: mnemonic ? 'UNLOCKED' : 'LOCKED',
      decryptedMnemonic: mnemonic || null,
      activeAddress: address,
      activeBtcAddress: btcAddress,
      activePublicKey: publicKey,
      hasVaultInStorage: true,
      autoLockTimeoutId: timer,
    })
  },

  resetAutoLockTimer: (): void => {
    const { vaultState, autoLockTimeoutId } = get()
    if (vaultState !== 'UNLOCKED') return

    if (autoLockTimeoutId) clearTimeout(autoLockTimeoutId)

    touchSessionInStorage(AUTO_LOCK_MS)

    const newTimer = setTimeout(() => {
      get().lock()
    }, AUTO_LOCK_MS)

    set({ autoLockTimeoutId: newTimer })
  },

  lock: (): void => {
    const currentTimer = get().autoLockTimeoutId
    if (currentTimer) clearTimeout(currentTimer)

    clearSessionFromStorage()

    set({
      vaultState: 'LOCKED',
      decryptedMnemonic: null,
      activeAddress: null,
      activeBtcAddress: null,
      activePublicKey: null,
      autoLockTimeoutId: null,
    })
  },

  wipeVault: async (): Promise<void> => {
    get().lock()
    clearSessionFromStorage()
    await destroyVault()
    set({
      hasVaultInStorage: false,
      activeAddress: null,
      activeBtcAddress: null,
      activePublicKey: null,
    })
  },
}))
