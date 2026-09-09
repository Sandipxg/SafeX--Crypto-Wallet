import Link from 'next/link'
import { Shield, Activity, Wallet } from 'lucide-react'

export function Navbar() {
  return (
    <header className="border-b border-dark-border bg-dark-card/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-wide hover:opacity-90 transition">
          <div className="p-2 rounded-lg bg-brand-600/20 text-brand-500 border border-brand-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <span>SafeX</span>
          <span className="text-xs px-2 py-0.5 rounded bg-brand-900/50 text-brand-500 border border-brand-500/20 font-mono">
            Devnet
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            <Wallet className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/status"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-brand-500 transition"
          >
            <Activity className="w-4 h-4" />
            <span>Status</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
