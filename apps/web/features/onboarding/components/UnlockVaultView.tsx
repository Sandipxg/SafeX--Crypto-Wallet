'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Activity,
  Trash2,
} from 'lucide-react'
import { useVaultStore } from '@/core/store/useVaultStore'

export const UnlockVaultView = () => {
  const router = useRouter()
  const { unlock, wipeVault } = useVaultStore()

  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)

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
