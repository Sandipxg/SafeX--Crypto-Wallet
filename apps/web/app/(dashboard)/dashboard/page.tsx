'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Lock, Unlock, Key, Copy, Check, LogOut, Settings, RefreshCw, AlertCircle } from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'

export default function DashboardPage() {
  const {
    vaultState,
    hasVaultInStorage,
    activeAddress,
    activeBtcAddress,
    checkVaultExists,
    unlock,
    lock,
    wipeVault,
  } = useVaultStore()

  const [passwordInput, setPasswordInput] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [copiedEvm, setCopiedEvm] = useState(false)
  const [copiedBtc, setCopiedBtc] = useState(false)

  useEffect(() => {
    checkVaultExists()
  }, [checkVaultExists])

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUnlockError(null)
    setIsUnlocking(true)
    try {
      await unlock(passwordInput)
      setPasswordInput('')
    } catch (err: any) {
      setUnlockError(err.message || 'Failed to unlock vault. Incorrect password.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleCopyEvmAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress)
      setCopiedEvm(true)
      setTimeout(() => setCopiedEvm(false), 2000)
    }
  }

  const handleCopyBtcAddress = () => {
    if (activeBtcAddress) {
      navigator.clipboard.writeText(activeBtcAddress)
      setCopiedBtc(true)
      setTimeout(() => setCopiedBtc(false), 2000)
    }
  }

  if (!hasVaultInStorage && !activeAddress && !activeBtcAddress) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="p-4 rounded-full bg-brand-500/10 text-brand-400 w-fit mx-auto border border-brand-500/20">
          <Key className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">No Wallet Found in Local Storage</h1>
          <p className="text-sm text-slate-400">
            Create a new vault or import an existing recovery phrase to get started.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition shadow-lg shadow-brand-600/20"
        >
          <span>Go to Wallet Setup</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header Status Banner */}
      <div className="p-6 rounded-2xl bg-dark-card border border-dark-border flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${vaultState === 'UNLOCKED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            {vaultState === 'UNLOCKED' ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">SafeX Dashboard</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${vaultState === 'UNLOCKED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                Vault {vaultState}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {vaultState === 'UNLOCKED' ? 'Decrypted in RAM memory — Ready for signing' : 'Encrypted in IndexedDB — Locked'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {vaultState === 'UNLOCKED' ? (
            <button
              onClick={lock}
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Vault</span>
            </button>
          ) : (
            <a
              href="#unlock-section"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-brand-600/20"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Vault</span>
            </a>
          )}

          <Link
            href="/settings"
            className="p-2 rounded-xl bg-dark-bg border border-dark-border text-slate-400 hover:text-white transition"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* EVM Address Card */}
          <div className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ethereum & EVM Address</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-900/50 text-brand-400 border border-brand-500/20 font-mono font-semibold">EVM (m/44'/60'/0'/0/0)</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-between gap-2">
              <span className="font-mono text-xs sm:text-sm text-white font-semibold truncate">
                {activeAddress || '0x71C7656EC7ab88b098def1734b743b44628b36d2'}
              </span>
              <button
                onClick={handleCopyEvmAddress}
                className="p-2 rounded-lg bg-dark-card text-slate-300 hover:text-white border border-dark-border transition shrink-0"
              >
                {copiedEvm ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Supports ETH, MATIC, BNB, Arbitrum, Base & all ERC-20 tokens.</p>
          </div>

          {/* Bitcoin Native SegWit Card */}
          <div className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bitcoin Address (Native SegWit)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold">BTC (m/84'/0'/0'/0/0)</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-between gap-2">
              <span className="font-mono text-xs sm:text-sm text-amber-300 font-semibold truncate">
                {activeBtcAddress || 'bc1q9x820938472938472938472938472938472938'}
              </span>
              <button
                onClick={handleCopyBtcAddress}
                className="p-2 rounded-lg bg-dark-card text-slate-300 hover:text-white border border-dark-border transition shrink-0"
              >
                {copiedBtc ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Native SegWit Bech32 address (BIP-84) with lowest transaction fees.</p>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border/60">
              <span className="text-[10px] text-slate-500 block">Session Status</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Authenticated
              </span>
            </div>

            <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border/60">
              <span className="text-[10px] text-slate-500 block">Encryption Standard</span>
              <span className="text-xs font-semibold text-slate-300 mt-0.5 block">Argon2id + AES-256-GCM</span>
            </div>
          </div>
        </div>

        {/* Quick Lock / Unlock Card */}
        <div id="unlock-section" className="p-6 rounded-2xl bg-dark-card border border-dark-border flex flex-col justify-between space-y-4 shadow-xl">
          {vaultState === 'UNLOCKED' ? (
            <div className="space-y-4 my-auto text-center">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto border border-emerald-500/20">
                <Unlock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Vault Unlocked</h3>
                <p className="text-xs text-slate-400">
                  Decrypted in active RAM. Auto-locks after 10 minutes of inactivity.
                </p>
              </div>
              <button
                onClick={lock}
                className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              >
                Lock Vault Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleUnlockSubmit} className="space-y-4 my-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Unlock Vault</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your password to decrypt private keys into active RAM.
                </p>
              </div>

              {unlockError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-white text-xs focus:outline-none focus:border-brand-500 transition"
              />

              <button
                type="submit"
                disabled={isUnlocking}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/20 disabled:opacity-50"
              >
                {isUnlocking ? 'Decrypting...' : 'Unlock Vault'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
