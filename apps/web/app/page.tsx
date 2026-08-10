import Link from 'next/link'
import { Shield, ArrowRight, Activity, Key, Wallet, Database } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-10 py-4">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/10 border border-brand-500/30 text-brand-500 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>Phase 0 Complete — Monorepo Boilerplate Ready</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          SafeX Crypto Exchange & Wallet
        </h1>
        <p className="text-base sm:text-lg text-slate-400">
          A hybrid platform combining self-custodial seed-phrase wallet mechanics with enterprise custodial exchange infrastructure.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link
            href="/status"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition shadow-lg shadow-brand-600/20"
          >
            <Activity className="w-4 h-4" />
            <span>Check Health Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="p-2.5 rounded-lg bg-brand-600/10 text-brand-500 w-fit">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Self-Custody Wallet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Phases 1–4: Client-side BIP39 mnemonics, BIP32/44 HD key derivation, and offline transaction signing for Ethereum & Bitcoin.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="p-2.5 rounded-lg bg-brand-600/10 text-brand-500 w-fit">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Custodial Exchange</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Phases 6–9: Deposit sweeping, double-entry PostgreSQL ledger, order book matching engine, and Proof of Reserves.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="p-2.5 rounded-lg bg-brand-600/10 text-brand-500 w-fit">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Modular Architecture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Monorepo setup with Next.js App Router, Node.js + TypeScript oRPC backend server, and PostgreSQL database container.
          </p>
        </div>
      </div>
    </div>
  )
}
