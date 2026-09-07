'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Lock, Unlock, Key, Settings, AlertCircle, Send, ArrowDownLeft, History, ExternalLink, RefreshCw } from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'
import { ChainSelector } from '@/components/ChainSelector'
import { ReceiveCard } from '@/components/ReceiveCard'
import { fetchWalletBalance } from '@/lib/crypto'

export default function DashboardPage() {
  const {
    vaultState,
    hasVaultInStorage,
    activeAddress,
    activeBtcAddress,
    checkVaultExists,
    unlock,
    lock,
  } = useVaultStore()

  const [activeChain, setActiveChain] = useState<string>('ethereum')
  const [passwordInput, setPasswordInput] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)

  // Live balance state
  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)

  useEffect(() => {
    checkVaultExists()
  }, [checkVaultExists])

  // Fetch live Sepolia ETH balance with direct RPC fallback
  const fetchLiveBalance = async () => {
    if (!activeAddress) return
    setIsFetchingBalance(true)
    try {
      const balance = await fetchWalletBalance(activeAddress)
      setEthBalance(balance)
    } catch (err) {
      console.error('[Dashboard] Balance query failed:', err)
      setEthBalance('0.0000')
    } finally {
      setIsFetchingBalance(false)
    }
  }

  useEffect(() => {
    if (activeAddress) {
      fetchLiveBalance()
    }
  }, [activeAddress])

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

  const evmAddressDisplay = activeAddress || ''
  const btcAddressDisplay = activeBtcAddress || ''

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
          <ChainSelector value={activeChain} onChange={setActiveChain} />

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

      {/* Balance & Action Buttons Card */}
      <div className="p-6 rounded-2xl bg-dark-card border border-dark-border shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Native Balance (Sepolia Testnet)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {ethBalance !== null ? `${Number(ethBalance).toFixed(4)}` : '0.0000'}
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">ETH</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLiveBalance}
              disabled={isFetchingBalance}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingBalance ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/send"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send ETH</span>
            </Link>

            <Link
              href="/receive"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Receive</span>
            </Link>

            <Link
              href="/history"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {(activeChain === 'ethereum' || activeChain === 'all') && (
            <ReceiveCard
              chainName="Ethereum (EVM)"
              symbol="ETH"
              address={evmAddressDisplay}
              derivationPath="m/44'/60'/0'/0/0"
              badgeText="BIP-44 EVM"
              accentColor="emerald"
            />
          )}

          {(activeChain === 'bitcoin' || activeChain === 'all') && (
            <ReceiveCard
              chainName="Bitcoin Native SegWit"
              symbol="BTC"
              address={btcAddressDisplay}
              derivationPath="m/84'/0'/0'/0/0"
              badgeText="BIP-84 SegWit"
              accentColor="amber"
            />
          )}
        </div>

        {/* Unlock Vault Form */}
        <div id="unlock-section" className="p-6 rounded-2xl bg-dark-card border border-dark-border flex flex-col justify-between space-y-4 shadow-xl">
          {vaultState === 'UNLOCKED' ? (
            <div className="space-y-4 my-auto text-center">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto border border-emerald-500/20">
                <Unlock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Vault Unlocked</h3>
                <p className="text-xs text-slate-400">
                  Decrypted in active RAM memory. Ready for signing.
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
