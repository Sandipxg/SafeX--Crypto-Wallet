import React from 'react'
import Link from 'next/link'
import { Shield, PlusCircle, Download, ArrowRight, Lock } from 'lucide-react'

export const OnboardingSelectionView = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>Zero-Trust Client-Side Encrypted Vault</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Welcome to SafeX Wallet
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Your seed phrase and private keys are encrypted locally on your device using Argon2id + AES-256-GCM. Our servers never touch your secret words.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Create Wallet Option */}
        <Link
          href="/onboarding/create"
          className="group relative p-8 rounded-2xl bg-dark-card border border-dark-border hover:border-brand-500/50 hover:bg-dark-card/80 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-xl"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 w-fit group-hover:scale-105 transition-transform">
              <PlusCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                Create New Vault
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generate a brand new 12 or 24-word BIP39 seed phrase and secure it with a local password.
              </p>
            </div>
          </div>

          <div className="flex items-center text-sm font-semibold text-brand-400 gap-2 group-hover:translate-x-1 transition-transform">
            <span>Start Wallet Setup</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Import Wallet Option */}
        <Link
          href="/onboarding/import"
          className="group relative p-8 rounded-2xl bg-dark-card border border-dark-border hover:border-brand-500/50 hover:bg-dark-card/80 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-xl"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit group-hover:scale-105 transition-transform">
              <Download className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                Import Existing Vault
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Restore an existing wallet using your 12 or 24-word recovery phrase (Trust Wallet, MetaMask, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-center text-sm font-semibold text-emerald-400 gap-2 group-hover:translate-x-1 transition-transform">
            <span>Import Recovery Phrase</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span>End-to-End Encrypted in IndexedDB via Argon2id & AES-256-GCM</span>
      </div>
    </div>
  )
}
