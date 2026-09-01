'use me'
'use client'

import React from 'react'
import { ChevronDown, Check, Lock } from 'lucide-react'

export interface ChainOption {
  id: string
  name: string
  symbol: string
  iconBadge?: string
  disabled?: boolean
}

export const DEFAULT_CHAINS: ChainOption[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', iconBadge: 'Ξ' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', iconBadge: '₿' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', iconBadge: 'MATIC', disabled: true },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', iconBadge: 'ARB', disabled: true },
  { id: 'base', name: 'Base', symbol: 'BASE', iconBadge: 'BASE', disabled: true },
]

interface ChainSelectorProps {
  chains?: ChainOption[]
  value: string
  onChange: (chainId: string) => void
}

export function ChainSelector({
  chains = DEFAULT_CHAINS,
  value,
  onChange,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const currentChain = chains.find((c) => c.id === value) || chains[0]

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
          {currentChain.iconBadge || currentChain.symbol[0]}
        </span>
        <span>{currentChain.name}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
          {currentChain.symbol}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 focus:outline-none animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Network
            </div>
            {chains.map((chain) => {
              const isSelected = chain.id === value
              return (
                <button
                  key={chain.id}
                  type="button"
                  disabled={chain.disabled}
                  onClick={() => {
                    if (!chain.disabled) {
                      onChange(chain.id)
                      setIsOpen(false)
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors ${
                    chain.disabled
                      ? 'opacity-50 cursor-not-allowed text-slate-500 hover:bg-transparent'
                      : isSelected
                      ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      chain.disabled
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-800 text-emerald-400 border border-slate-700'
                    }`}>
                      {chain.iconBadge || chain.symbol[0]}
                    </span>
                    <span>{chain.name}</span>
                  </div>

                  {chain.disabled ? (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50">
                      <Lock className="w-2.5 h-2.5" /> Coming Soon
                    </span>
                  ) : isSelected ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
