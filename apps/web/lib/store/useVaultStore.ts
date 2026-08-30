import { create } from 'zustand'
import { VaultState } from '../crypto/types'
import { unlockVault, hasVault as checkHasVault, destroyVault } from '../crypto/vault'

interface VaultStoreState {
  vaultState: VaultState
  hasVaultInStorage: boolean
  decryptedMnemonic: string | null
  activeAddress: `0x${string}` | null
  activeBtcAddress: string | null
  activePublicKey: `0x${string}` | null
  autoLockTimeoutId: NodeJS.Timeout | number | null

  // Actions
  checkVaultExists: () => Promise<boolean>
  unlock: (password: string) => Promise<void>
  lock: () => void
  setSessionCredentials: (address: `0x${string}`, btcAddress: string, publicKey: `0x${string}`, mnemonic?: string) => void
  resetAutoLockTimer: () => void
  wipeVault: () => Promise<void>
}

/**
 * Auto-Lock Duration: 10 minutes (600,000 milliseconds)
 */
const AUTO_LOCK_MS = 10 * 60 * 1000 // 10 minutes

/**
 * ============================================================================
 * useVaultStore (Zustand Store)
 * ============================================================================
 * @description In-RAM state store for managing client wallet lock status,
 *              active EVM & Bitcoin wallet addresses, decrypted seed phrase string,
 *              and the 10-minute auto-lock security timer.
 *
 * @state_fields:
 * - vaultState         : 'LOCKED' | 'UNLOCKED'
 * - hasVaultInStorage  : boolean (whether encrypted record exists in IndexedDB)
 * - decryptedMnemonic  : string | null (held in RAM ONLY while UNLOCKED)
 * - activeAddress      : '0x...' public EVM address
 * - activeBtcAddress   : 'bc1q...' public Bitcoin Native SegWit address
 * - autoLockTimeoutId  : active timer handle for 10-minute auto-lock
 *
 * @actions:
 * - checkVaultExists   : Queries IndexedDB to see if wallet exists on device.
 * - unlock(password)   : Decrypts vault, stores mnemonic in RAM, starts 10m timer.
 * - resetAutoLockTimer : Resets 10m countdown on user activity.
 * - lock()             : Cancels timer, sets vaultState to LOCKED, wipes mnemonic to null.
 * - wipeVault()        : Locks state and permanently destroys IndexedDB record.
 */
export const useVaultStore = create<VaultStoreState>((set, get) => ({
  vaultState: 'LOCKED',
  hasVaultInStorage: false,
  decryptedMnemonic: null,
  activeAddress: null,
  activeBtcAddress: null,
  activePublicKey: null,
  autoLockTimeoutId: null,

  checkVaultExists: async () => {
    const exists = await checkHasVault()
    set({ hasVaultInStorage: exists })
    return exists
  },

  unlock: async (password: string) => {
    const { mnemonic, address, btcAddress, publicKey } = await unlockVault(password)
    
    // Clear existing timer if any
    const currentTimer = get().autoLockTimeoutId
    if (currentTimer) clearTimeout(currentTimer)

    // Set 10-minute auto-lock timer
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

  setSessionCredentials: (address: `0x${string}`, btcAddress: string, publicKey: `0x${string}`, mnemonic?: string) => {
    const currentTimer = get().autoLockTimeoutId
    if (currentTimer) clearTimeout(currentTimer)

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

  resetAutoLockTimer: () => {
    const { vaultState, autoLockTimeoutId } = get()
    if (vaultState !== 'UNLOCKED') return

    if (autoLockTimeoutId) clearTimeout(autoLockTimeoutId)

    const newTimer = setTimeout(() => {
      get().lock()
    }, AUTO_LOCK_MS)

    set({ autoLockTimeoutId: newTimer })
  },

  lock: () => {
    const currentTimer = get().autoLockTimeoutId
    if (currentTimer) clearTimeout(currentTimer)

    set({
      vaultState: 'LOCKED',
      decryptedMnemonic: null,
      autoLockTimeoutId: null,
    })
  },

  wipeVault: async () => {
    get().lock()
    await destroyVault()
    set({
      hasVaultInStorage: false,
      activeAddress: null,
      activeBtcAddress: null,
      activePublicKey: null,
    })
  },
}))
