'use client'

import React, { useState, useMemo } from 'react'
import { Search, Check } from 'lucide-react'
import { DexTokenItem } from '../swap.types'

interface TokenSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectToken: (token: DexTokenItem) => void
  availableTokens: DexTokenItem[]
  selectedTokenAddress?: string
}

export function TokenSelectModal({
  isOpen,
  onClose,
  onSelectToken,
  availableTokens,
  selectedTokenAddress,
}: TokenSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return availableTokens
    const q = searchQuery.toLowerCase().trim()
    return availableTokens.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.address.toLowerCase() === q
    )
  }, [availableTokens, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-dark-card border border-dark-border p-5 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-dark-border/60 pb-3">
          <h3 className="text-sm font-bold text-white">Select a Token</h3>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              onClose()
            }}
            className="text-slate-400 hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Search name or paste contract address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Quick Select Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {availableTokens.slice(0, 5).map((token) => (
            <button
              key={token.address}
              type="button"
              onClick={() => {
                onSelectToken(token)
                onClose()
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-bg hover:bg-slate-800 border border-dark-border text-xs font-bold text-slate-200 transition"
            >
              {token.logoUri && (
                <img
                  src={token.logoUri}
                  alt={token.symbol}
                  className="w-3.5 h-3.5 rounded-full"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              )}
              <span>{token.symbol}</span>
            </button>
          ))}
        </div>

        {/* Token List */}
        <div className="overflow-y-auto divide-y divide-dark-border/40 pr-1 flex-1 space-y-1">
          {filteredTokens.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No tokens found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredTokens.map((token) => {
              const isSelected =
                selectedTokenAddress &&
                token.address.toLowerCase() === selectedTokenAddress.toLowerCase()

              return (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => {
                    onSelectToken(token)
                    onClose()
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-800/80 transition text-left ${
                    isSelected ? 'bg-brand-500/10 border border-brand-500/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {token.logoUri ? (
                      <img
                        src={token.logoUri}
                        alt={token.symbol}
                        className="w-7 h-7 rounded-full bg-slate-800 p-0.5"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-brand-400">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{token.symbol}</span>
                        {token.isNative && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                            Native
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                        {token.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-slate-200 block">
                      {Number(token.balance || '0').toFixed(4)}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-brand-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
