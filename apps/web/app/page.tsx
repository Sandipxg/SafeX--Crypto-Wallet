'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Shield,
  PlusCircle,
  Download,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Activity,
  Trash2,
} from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'

export default function HomePage() {
  const router = useRouter()
  const {
    vaultState,
    hasVaultInStorage,
    checkVaultExists,
    unlock,
    wipeVault,
  } = useVaultStore()

  const [isCheckingVault, setIsCheckingVault] = useState(true)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const exists = await checkVaultExists()
        if (isMounted) {
          setIsCheckingVault(false)
          if (exists && vaultState === 'UNLOCKED') {
            router.replace('/dashboard')
          }
        }
      } catch {
        if (isMounted) {
          setIsCheckingVault(false)
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [checkVaultExists, vaultState, router])

  const handleUnlockSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUnlockError(null)
    setIsUnlocking(true)

    try {
      await unlock(passwordInput)
      setPasswordInput('')
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Incorrect password. Decryption failed.'
      setUnlockError(message)
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleWipeVault = async () => {
    await wipeVault()
    setShowWipeConfirm(false)
    setPasswordInput('')
    setUnlockError(null)
  }

  // 1. Initial Loading State while checking IndexedDB
  if (isCheckingVault) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 animate-pulse">
          <Shield className="w-10 h-10" />
        </div>
        <p className="text-sm font-mono text-slate-400">Initializing SafeX Vault...</p>
      </div>
    )
  }

  // 2. Existing User (Wallet Exists in Storage) -> Passcode Prompt
  if (hasVaultInStorage) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 relative">
        <div className="max-w-md w-full p-8 rounded-3xl bg-dark-card border border-dark-border shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
          {/* Top Lock Badge */}
          <div className="text-center space-y-3">
            <div className="p-4 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 w-fit mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-brand-400 text-[11px] font-mono font-semibold border border-brand-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SafeX Encrypted Vault</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Unlock SafeX</h2>
              <p className="text-xs text-slate-400">
                Enter your master password to unlock your wallet and continue to your dashboard.
              </p>
            </div>
          </div>

          {unlockError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{unlockError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Master Passcode / Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl bg-dark-bg border border-dark-border text-white text-sm focus:outline-none focus:border-brand-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUnlocking || !passwordInput}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUnlocking ? 'Decrypting Vault...' : 'Unlock SafeX'}
            </button>
          </form>

          {/* Reset Vault Option */}
          <div className="pt-4 border-t border-dark-border/80 text-center">
            {!showWipeConfirm ? (
              <button
                type="button"
                onClick={() => setShowWipeConfirm(true)}
                className="text-xs text-slate-500 hover:text-red-400 transition inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Forgot Password? Reset Vault</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3 text-left">
                <p className="text-xs text-red-300">
                  <strong>Warning:</strong> Resetting erases your encrypted local vault. Ensure you have your recovery seed phrase saved to restore later.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWipeConfirm(false)}
                    className="w-1/2 py-2 rounded-xl bg-dark-bg text-slate-300 text-xs font-semibold border border-dark-border hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleWipeVault}
                    className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Health Check in Corner */}
        <Link
          href="/status"
          className="fixed bottom-5 right-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition shadow-lg backdrop-blur-md"
          title="View System & Blockchain Health Status"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>System Status</span>
        </Link>
      </div>
    )
  }

  // 3. New User (No Vault in Storage) -> Create or Import Options
  return (
    <div className="min-h-[75vh] flex flex-col justify-center max-w-4xl mx-auto py-10 space-y-10 relative">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>Zero-Trust Self-Custody</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Welcome to SafeX
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Choose how you would like to set up your crypto wallet. Your keys never leave this device.
        </p>
      </div>

      {/* Main Choice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Create Wallet Option */}
        <Link
          href="/onboarding/create"
          className="group relative p-8 rounded-3xl bg-dark-card border border-dark-border hover:border-brand-500/50 hover:bg-slate-900/60 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 w-fit group-hover:scale-105 transition-transform">
              <PlusCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                Create New Wallet
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generate a fresh 12 or 24-word BIP39 recovery seed phrase and secure it with a master password.
              </p>
            </div>
          </div>

          <div className="flex items-center text-sm font-semibold text-brand-400 gap-2 group-hover:translate-x-1 transition-transform">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Import Wallet Option */}
        <Link
          href="/onboarding/import"
          className="group relative p-8 rounded-3xl bg-dark-card border border-dark-border hover:border-emerald-500/50 hover:bg-slate-900/60 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit group-hover:scale-105 transition-transform">
              <Download className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                Import Existing Wallet
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Restore an existing wallet using your 12 or 24-word recovery phrase (from Trust Wallet, MetaMask, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-center text-sm font-semibold text-emerald-400 gap-2 group-hover:translate-x-1 transition-transform">
            <span>Import Seed Phrase</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span>Hardware-grade encryption in IndexedDB via Argon2id + AES-256-GCM</span>
      </div>

      {/* Health Check Status in Corner */}
      <Link
        href="/status"
        className="fixed bottom-5 right-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition shadow-lg backdrop-blur-md"
        title="View System & Blockchain Health Status"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span>System Status</span>
      </Link>
    </div>
  )
}
