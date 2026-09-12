'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export function SecurityFooter() {
  return (
    <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Zero-Trust Architecture: Private keys reside in RAM memory only and never leave this device.
        </span>
      </div>
      <Link
        href="/settings"
        className="text-brand-400 hover:underline font-semibold transition shrink-0"
      >
        Vault Security & Lock Controls →
      </Link>
    </div>
  )
}
