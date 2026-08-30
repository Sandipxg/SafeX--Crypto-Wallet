'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, AlertTriangle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react'
import { validateMnemonic, normalizeMnemonic } from '@/lib/crypto/bip39'
import { createAndSaveVault } from '@/lib/crypto/vault'
import { useVaultStore } from '@/lib/store/useVaultStore'

export default function ImportWalletPage() {
  const router = useRouter()
  const setSessionCredentials = useVaultStore((state) => state.setSessionCredentials)

  const [wordCount, setWordCount] = useState<12 | 24>(12)
  const [words, setWords] = useState<string[]>(Array(12).fill(''))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleWordCountChange = (count: 12 | 24) => {
    setWordCount(count)
    setWords(Array(count).fill(''))
    setError(null)
  }

  const handleWordChange = (idx: number, val: string) => {
    const updated = [...words]
    
    // Handle paste of full mnemonic phrase into single box
    const trimmed = val.trim()
    if (trimmed.includes(' ')) {
      const pastedWords = normalizeMnemonic(trimmed).split(' ')
      if (pastedWords.length === 12 || pastedWords.length === 24) {
        setWordCount(pastedWords.length as 12 | 24)
        setWords(pastedWords)
        setError(null)
        return
      }
    }

    updated[idx] = val
    setWords(updated)
    setError(null)
  }

  const fullPhrase = normalizeMnemonic(words.join(' '))
  const isValidChecksum = fullPhrase.split(' ').length === wordCount && validateMnemonic(fullPhrase)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidChecksum) {
      setError('Invalid seed phrase. Check word spelling and sequence.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      // Encrypt and save vault to IndexedDB
      const identity = await createAndSaveVault(password, fullPhrase)

      // Set active Zustand RAM session state
      setSessionCredentials(identity.address, identity.btcAddress, identity.publicKey, fullPhrase)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to import vault.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-dark-card border border-dark-border space-y-6 shadow-xl">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Download className="w-6 h-6 text-emerald-400" />
            <span>Import Existing Recovery Phrase</span>
          </h2>
          <p className="text-xs text-slate-400">
            Enter your 12 or 24-word seed phrase from Trust Wallet, MetaMask, or Ledger. You can paste the entire phrase into the first box.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Seed Phrase Length</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleWordCountChange(12)}
                className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${wordCount === 12 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-dark-bg border-dark-border text-slate-400'}`}
              >
                12 Words
              </button>
              <button
                type="button"
                onClick={() => handleWordCountChange(24)}
                className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${wordCount === 24 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-dark-bg border-dark-border text-slate-400'}`}
              >
                24 Words
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {words.map((word, idx) => (
              <div key={idx} className="relative">
                <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-500 font-mono select-none">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  required
                  value={word}
                  onChange={(e) => handleWordChange(idx, e.target.value)}
                  className="w-full pl-7 pr-2 py-2 rounded-lg bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            ))}
          </div>

          {fullPhrase.split(' ').filter(Boolean).length === wordCount && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${isValidChecksum ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {isValidChecksum ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{isValidChecksum ? 'BIP39 Checksum Verified — Valid Seed Phrase!' : 'Invalid BIP39 Checksum. Check for typos.'}</span>
            </div>
          )}

          <div className="pt-4 border-t border-dark-border space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Create Local Password</span>
              </h3>
              <p className="text-xs text-slate-400">
                This password encrypts your imported vault in browser IndexedDB.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isValidChecksum}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {isSubmitting ? 'Encrypting & Importing Vault...' : 'Import Vault & Launch Wallet'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
