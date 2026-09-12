'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Key, AlertCircle, Eye, EyeOff, ShieldCheck, Trash2, ArrowRight } from 'lucide-react'
import { useVaultStore } from '@/core/store/useVaultStore'

interface VaultGateProps {
  children: React.ReactNode
}

export function VaultGate({ children }: VaultGateProps) {
  const {
    vaultState,
    hasVaultInStorage,
    checkVaultExists,
    unlock,
    wipeVault,
  } = useVaultStore()

  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)

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
      setUnlockError(err.message || 'Incorrect password. Decryption failed.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleWipeVault = async () => {
    await wipeVault()
    setShowWipeConfirm(false)
  }

  // 1. No wallet created on device
  if (!hasVaultInStorage && vaultState !== 'UNLOCKED') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="p-4 rounded-full bg-brand-500/10 text-brand-400 w-fit mx-auto border border-brand-500/20">
          <Key className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">No Wallet Found on Device</h1>
          <p className="text-sm text-slate-400">
            Create a new vault or import an existing 12/24-word recovery phrase to get started.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition shadow-lg shadow-brand-600/20"
        >
          <span>Go to Wallet Setup</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // 2. Vault exists on device but is LOCKED -> Show Full-Screen Passcode Gate
  if (vaultState === 'LOCKED') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-dark-card border border-dark-border shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
          {/* Top Security Status Indicator */}
          <div className="text-center space-y-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-[11px] font-mono font-semibold border border-amber-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted AES-256-GCM Vault</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">SafeX Vault Locked</h2>
              <p className="text-xs text-slate-400">
                Enter your master password to decrypt private keys into active RAM.
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
              {isUnlocking ? 'Decrypting Private Keys...' : 'Unlock SafeX Vault'}
            </button>
          </form>

          {/* Reset / Wipe Safety Dropdown */}
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
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
                <p className="text-xs text-red-300">
                  <strong>Warning:</strong> Resetting will permanently erase your local encrypted vault record. Make sure you have your recovery seed phrase saved!
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
                    Confirm Wipe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 3. Vault is UNLOCKED -> Render protected children components
  return <>{children}</>
}
