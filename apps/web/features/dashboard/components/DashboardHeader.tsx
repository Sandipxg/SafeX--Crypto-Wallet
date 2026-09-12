'use client'

import React from 'react'
import Link from 'next/link'
import { Wallet, Settings } from 'lucide-react'
import { ChainSelector } from '@/components/ChainSelector'

interface DashboardHeaderProps {
  activeChain: string
  onChainChange: (chainIdStr: string) => void
}

export function DashboardHeader({ activeChain, onChainChange }: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-dark-border/60">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">SafeX Portfolio</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Encrypted Client Session</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ChainSelector value={activeChain} onChange={onChainChange} />

        <Link
          href="/settings"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-2 text-xs font-semibold shadow-sm"
          title="Security & Account Settings"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>
    </div>
  )
}
