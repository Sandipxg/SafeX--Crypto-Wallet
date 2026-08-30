'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, Check, Copy, AlertTriangle, ArrowRight, Lock, Key } from 'lucide-react'
import { generateMnemonic } from '@/lib/crypto/bip39'
import { createAndSaveVault } from '@/lib/crypto/vault'
import { useVaultStore } from '@/lib/store/useVaultStore'

export default function CreateWalletPage() {
  const router = useRouter()
  const setSessionCredentials = useVaultStore((state) => state.setSessionCredentials)

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [entropyBits, setEntropyBits] = useState<128 | 256>(128)
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [hasBackedUp, setHasBackedUp] = useState(false)
  const [copied, setCopied] = useState(false)

  // Verification state
  const [verifyPositions, setVerifyPositions] = useState<number[]>([])
  const [verifyInputs, setVerifyInputs] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: 'None', score: 0 }
    if (pass.length < 6) return { label: 'Too short (min 6 chars)', score: 1 }
    let score = 2
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    if (score >= 4) return { label: 'Strong', score: 4 }
    if (score >= 3) return { label: 'Good', score: 3 }
    return { label: 'Fair', score: 2 }
  }

  const strength = getPasswordStrength(password)

  // Step 1 -> Step 2
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    
    // Generate Mnemonic
    const generated = generateMnemonic(entropyBits)
    setMnemonic(generated)

    // Prepare 3 random verification positions (1-indexed)
    const words = generated.split(' ')
    const totalWords = words.length
    const pos1 = Math.floor(Math.random() * (totalWords / 3)) + 1
    const pos2 = Math.floor(Math.random() * (totalWords / 3)) + Math.floor(totalWords / 3) + 1
    const pos3 = Math.floor(Math.random() * (totalWords / 3)) + Math.floor((2 * totalWords) / 3) + 1

    setVerifyPositions([pos1, pos2, pos3])
    setStep(2)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Step 2 -> Step 3
  const handleProceedToVerification = () => {
    if (!hasBackedUp) {
      setError('Please check the box confirming you have backed up your seed phrase.')
      return
    }
    setError(null)
    setStep(3)
  }

  // Final Vault Creation
  const handleVerifyAndFinalize = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const words = mnemonic.split(' ')
    for (const pos of verifyPositions) {
      const expected = words[pos - 1].toLowerCase().trim()
      const entered = (verifyInputs[pos] || '').toLowerCase().trim()
      if (entered !== expected) {
        setError(`Word #${pos} does not match. Please check your backup and try again.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      // 1. Encrypt and save vault to IndexedDB
      const identity = await createAndSaveVault(password, mnemonic)

      // 2. Set active Zustand RAM session state
      setSessionCredentials(identity.address, identity.btcAddress, identity.publicKey, mnemonic)

      // 3. Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create vault.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-dark-card border border-dark-border">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-brand-500 text-white' : 'bg-dark-border text-slate-400'}`}>1</span>
          <span className={step >= 1 ? 'text-white' : 'text-slate-500'}>Password</span>
        </div>
        <div className="h-0.5 w-10 bg-dark-border" />
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-brand-500 text-white' : 'bg-dark-border text-slate-400'}`}>2</span>
          <span className={step >= 2 ? 'text-white' : 'text-slate-500'}>Backup Seed</span>
        </div>
        <div className="h-0.5 w-10 bg-dark-border" />
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-brand-500 text-white' : 'bg-dark-border text-slate-400'}`}>3</span>
          <span className={step >= 3 ? 'text-white' : 'text-slate-500'}>Verify</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: PASSWORD SETUP */}
      {step === 1 && (
        <form onSubmit={handlePasswordSubmit} className="p-8 rounded-2xl bg-dark-card border border-dark-border space-y-6 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-brand-400" />
              <span>Create Vault Password</span>
            </h2>
            <p className="text-xs text-slate-400">
              This password encrypts your seed phrase inside browser IndexedDB using Argon2id. It acts as your daily unlock code.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Entropy Length</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEntropyBits(128)}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition ${entropyBits === 128 ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-dark-bg border-dark-border text-slate-400'}`}
                >
                  12 Words (128-bit)
                </button>
                <button
                  type="button"
                  onClick={() => setEntropyBits(256)}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition ${entropyBits === 256 ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-dark-bg border-dark-border text-slate-400'}`}
                >
                  24 Words (256-bit)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong password (min 6 chars)"
                className="w-full px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-sm focus:outline-none focus:border-brand-500 transition"
              />
              {password && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-dark-border overflow-hidden">
                    <div className={`h-full transition-all ${strength.score <= 1 ? 'bg-red-500 w-1/4' : strength.score === 2 ? 'bg-amber-500 w-2/4' : strength.score === 3 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'}`} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{strength.label}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-sm focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
          >
            <span>Next: Generate Seed Phrase</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* STEP 2: DISPLAY MNEMONIC */}
      {step === 2 && (
        <div className="p-8 rounded-2xl bg-dark-card border border-dark-border space-y-6 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Key className="w-6 h-6 text-brand-400" />
              <span>Back Up Your Secret Recovery Phrase</span>
            </h2>
            <p className="text-xs text-slate-400">
              Write down these {mnemonic.split(' ').length} words in order on paper. Never share them with anyone.
            </p>
          </div>

          <div className="relative p-6 rounded-xl bg-dark-bg border border-dark-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                {mnemonic.split(' ').length}-Word BIP39 Seed Phrase
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="px-2.5 py-1 rounded-lg bg-dark-card text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 transition border border-dark-border"
                >
                  {showMnemonic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showMnemonic ? 'Hide' : 'Reveal'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-dark-card text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 transition border border-dark-border"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className={`grid grid-cols-3 sm:grid-cols-4 gap-2.5 ${!showMnemonic ? 'blur-sm select-none pointer-events-none' : ''}`}>
              {mnemonic.split(' ').map((word, idx) => (
                <div key={idx} className="px-3 py-2 rounded-lg bg-dark-card border border-dark-border text-xs flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono w-4">{idx + 1}.</span>
                  <span className="font-mono text-white font-medium">{word}</span>
                </div>
              ))}
            </div>

            {!showMnemonic && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/60 backdrop-blur-xs rounded-xl">
                <button
                  type="button"
                  onClick={() => setShowMnemonic(true)}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-lg hover:bg-brand-500 transition"
                >
                  Click to Reveal Words
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              If you lose these words, your funds are gone forever. SafeX support can never recover them for you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="backedUpCheck"
              checked={hasBackedUp}
              onChange={(e) => setHasBackedUp(e.target.checked)}
              className="w-4 h-4 rounded bg-dark-bg border-dark-border text-brand-500 focus:ring-0"
            />
            <label htmlFor="backedUpCheck" className="text-xs text-slate-300 cursor-pointer select-none">
              I have written down and securely stored my recovery phrase.
            </label>
          </div>

          <button
            type="button"
            onClick={handleProceedToVerification}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
          >
            <span>Verify Word Sequence</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 3: VERIFY WORDS */}
      {step === 3 && (
        <form onSubmit={handleVerifyAndFinalize} className="p-8 rounded-2xl bg-dark-card border border-dark-border space-y-6 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-brand-400" />
              <span>Verify Your Backup</span>
            </h2>
            <p className="text-xs text-slate-400">
              Confirm your recovery phrase by typing the requested word positions below.
            </p>
          </div>

          <div className="space-y-4">
            {verifyPositions.map((pos) => (
              <div key={pos} className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Word #{pos}
                </label>
                <input
                  type="text"
                  required
                  value={verifyInputs[pos] || ''}
                  onChange={(e) => setVerifyInputs({ ...verifyInputs, [pos]: e.target.value })}
                  placeholder={`Enter word #${pos}`}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-sm font-mono focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Encrypting & Saving Vault...' : 'Encrypt Vault & Launch Wallet'}
          </button>
        </form>
      )}
    </div>
  )
}
