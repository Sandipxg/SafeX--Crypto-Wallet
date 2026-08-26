'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Eye, EyeOff, Lock, AlertTriangle, Shield, Trash2, Check, Clock } from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'
import { unlockVault } from '@/lib/crypto/vault'

export default function SettingsPage() {
  const router = useRouter()
  const { lock, wipeVault } = useVaultStore()

  // Reveal Seed Modal state
  const [showRevealModal, setShowRevealModal] = useState(false)
  const [revealPassword, setRevealPassword] = useState('')
  const [revealedMnemonic, setRevealedMnemonic] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(30)
  const [error, setError] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Wipe confirm state
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)

  // 30-second auto-hide timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (revealedMnemonic && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      handleCloseRevealModal()
    }
    return () => clearInterval(interval)
  }, [revealedMnemonic, countdown])

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

  const handleCloseRevealModal = () => {
    setRevealedMnemonic(null)
    setRevealPassword('')
    setCountdown(30)
    setError(null)
    setShowRevealModal(false)
  }

  const handleWipeVault = async () => {
    await wipeVault()
    router.push('/onboarding')
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-400" />
          <span>Security & Account Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage your zero-trust local vault, seed phrase backups, and session security.
        </p>
      </div>

      <div className="space-y-4">
        {/* REVEAL SEED PHRASE CARD */}
        <div className="p-6 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-400" />
              <span>Reveal Secret Recovery Phrase</span>
            </h3>
            <p className="text-xs text-slate-400">
              View your 12 or 24-word seed phrase behind password re-verification.
            </p>
          </div>
          <button
            onClick={() => setShowRevealModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 border border-brand-500/30 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Reveal Phrase</span>
          </button>
        </div>

        {/* LOCK VAULT CARD */}
        <div className="p-6 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Lock Active Vault</span>
            </h3>
            <p className="text-xs text-slate-400">
              Immediately zeroizes in-memory decrypted keys from RAM.
            </p>
          </div>
          <button
            onClick={lock}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Now</span>
          </button>
        </div>

        {/* DESTROY VAULT CARD */}
        <div className="p-6 rounded-2xl bg-dark-card border border-red-500/20 flex items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Wipe Local Vault Data</span>
            </h3>
            <p className="text-xs text-slate-400">
              Deletes encrypted vault record from browser IndexedDB. Ensure you have your seed phrase saved.
            </p>
          </div>
          <button
            onClick={() => setShowWipeConfirm(true)}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition shrink-0"
          >
            Wipe Vault
          </button>
        </div>
      </div>

      {/* REVEAL SEED MODAL */}
      {showRevealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-dark-card border border-dark-border space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-400" />
                <span>Reveal Recovery Phrase</span>
              </h3>
              <button
                onClick={handleCloseRevealModal}
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
                    onClick={handleCloseRevealModal}
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
                  onClick={handleCloseRevealModal}
                  className="w-full py-2.5 rounded-xl bg-dark-bg border border-dark-border text-slate-300 text-xs font-semibold hover:text-white transition"
                >
                  Close & Zeroize Memory
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WIPE CONFIRM MODAL */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-dark-card border border-red-500/30 space-y-6 shadow-2xl">
            <div className="space-y-2 text-center">
              <div className="p-3 rounded-full bg-red-500/10 text-red-400 w-fit mx-auto border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Wipe Local Vault Storage?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will delete your encrypted vault from IndexedDB. If you do not have your 12-word seed phrase backed up, your funds will be lost forever.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWipeConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-slate-300 text-xs font-semibold hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWipeVault}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
              >
                Yes, Delete Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
