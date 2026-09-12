'use client'

import React, { useState, useEffect } from 'react'
import { Key, AlertTriangle, Clock } from 'lucide-react'
import { unlockVault } from '@/core/crypto'

export interface RevealSeedModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RevealSeedModal = ({ isOpen, onClose }: RevealSeedModalProps) => {
  const [revealPassword, setRevealPassword] = useState('')
  const [revealedMnemonic, setRevealedMnemonic] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(30)
  const [error, setError] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)

  const handleClose = () => {
    setRevealedMnemonic(null)
    setRevealPassword('')
    setCountdown(30)
    setError(null)
    onClose()
  }

  // 30-second auto-hide timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (revealedMnemonic && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      handleClose()
    }
    return () => clearInterval(interval)
  }, [revealedMnemonic, countdown])

  if (!isOpen) return null

  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsDecrypting(true)
    try {
      const { mnemonic } = await unlockVault(revealPassword)
      setRevealedMnemonic(mnemonic)
      setCountdown(30)
      setRevealPassword('')
    } catch (err: any) {
      setError(err.message || 'Incorrect password.')
    } finally {
      setIsDecrypting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded-2xl bg-dark-card border border-dark-border space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-400" />
            <span>Reveal Recovery Phrase</span>
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {!revealedMnemonic ? (
          <form onSubmit={handleRevealSubmit} className="space-y-4">
            <p className="text-xs text-slate-400">
              Re-enter your vault password to decrypt your recovery phrase in RAM for 30 seconds.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <input
              type="password"
              required
              value={revealPassword}
              onChange={(e) => setRevealPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-sm focus:outline-none focus:border-brand-500 transition"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 text-xs font-semibold hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDecrypting}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isDecrypting ? 'Decrypting...' : 'Confirm & Reveal'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4" />
                <span>Auto-hiding in {countdown}s</span>
              </div>
              <span className="font-mono text-[10px]">RAM Active</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border grid grid-cols-3 gap-2">
              {revealedMnemonic.split(' ').map((word, idx) => (
                <div key={idx} className="p-2 rounded bg-dark-card border border-dark-border text-xs flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">{idx + 1}.</span>
                  <span className="font-mono text-white font-medium">{word}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-dark-bg border border-dark-border text-slate-300 text-xs font-semibold hover:text-white transition"
            >
              Close & Zeroize Memory
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
