'use client'

import React from 'react'
import {
  Sparkles,
  ArrowDownUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  Lock,
  Zap,
} from 'lucide-react'
import { DexTokenItem, SwapQuoteInfo } from '../swap.types'

interface SwapCardProps {
  amountIn: string
  onAmountInChange: (val: string) => void
  amountOut: string
  onAmountOutChange: (val: string) => void
  selectedTokenIn: DexTokenItem
  selectedTokenOut: DexTokenItem | null
  onOpenTokenSelector: (target: 'IN' | 'OUT') => void
  onFlipTokens: () => void
  usdValueIn: string
  usdValueOut: string
  isQuoting: boolean
  lastEditedField: 'IN' | 'OUT'
  activeQuote: SwapQuoteInfo | null
  quoteError: string | null
  isInsufficientBalance: boolean
  isAllowanceNeeded: boolean
  slippageTolerance: number
  onOpenSettings: () => void
  onApproveClick: () => void
  onSwapClick: () => void
}

export function SwapCard({
  amountIn,
  onAmountInChange,
  amountOut,
  onAmountOutChange,
  selectedTokenIn,
  selectedTokenOut,
  onOpenTokenSelector,
  onFlipTokens,
  usdValueIn,
  usdValueOut,
  isQuoting,
  lastEditedField,
  activeQuote,
  quoteError,
  isInsufficientBalance,
  isAllowanceNeeded,
  slippageTolerance,
  onOpenSettings,
  onApproveClick,
  onSwapClick,
}: SwapCardProps) {
  return (
    <div className="p-6 rounded-3xl bg-dark-card border border-dark-border shadow-2xl relative space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">SafeX Swap</h2>
            <p className="text-[11px] text-slate-400">Uniswap V2 AMM • Offline ECDSA Signing</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Slippage:</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-2 py-0.5 rounded-md bg-dark-bg hover:bg-slate-800 border border-dark-border text-slate-200 font-semibold transition"
          >
            {slippageTolerance}%
          </button>
        </div>
      </div>

      {/* Pay Input Box ("You Pay") */}
      <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border/80 space-y-2 focus-within:border-brand-500/60 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">You Pay</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span>Balance:</span>
            <span className="text-slate-200 font-semibold">
              {Number(selectedTokenIn?.balance || '0').toFixed(4)} {selectedTokenIn?.symbol}
            </span>
            <button
              type="button"
              onClick={() => onAmountInChange(selectedTokenIn?.balance || '0')}
              className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition font-bold"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '')
              onAmountInChange(val)
            }}
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none"
          />

          {/* Token In Selector Button */}
          <button
            type="button"
            onClick={() => onOpenTokenSelector('IN')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white text-xs font-bold font-mono transition shrink-0 shadow-sm"
          >
            {selectedTokenIn?.logoUri && (
              <img
                src={selectedTokenIn.logoUri}
                alt={selectedTokenIn.symbol}
                className="w-4 h-4 rounded-full"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            )}
            <span>{selectedTokenIn?.symbol || 'Select'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>≈ ${usdValueIn} USD</span>
          {isQuoting && lastEditedField === 'OUT' && (
            <span className="flex items-center gap-1 text-brand-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Calculating...</span>
            </span>
          )}
        </div>
      </div>

      {/* Direction Switch Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          type="button"
          onClick={onFlipTokens}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-dark-border shadow-lg transition hover:scale-105 active:scale-95"
          title="Reverse Swap Direction"
        >
          <ArrowDownUp className="w-4 h-4 text-brand-400" />
        </button>
      </div>

      {/* Receive Input Box ("You Receive") */}
      <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border/80 space-y-2 focus-within:border-brand-500/60 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">You Receive</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span>Balance:</span>
            <span className="text-slate-200 font-semibold">
              {Number(selectedTokenOut?.balance || '0').toFixed(4)} {selectedTokenOut?.symbol}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="0.0"
            value={amountOut}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '')
              onAmountOutChange(val)
            }}
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none"
          />

          {/* Token Out Selector Button */}
          <button
            type="button"
            onClick={() => onOpenTokenSelector('OUT')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white text-xs font-bold font-mono transition shrink-0 shadow-sm"
          >
            {selectedTokenOut?.logoUri && (
              <img
                src={selectedTokenOut.logoUri}
                alt={selectedTokenOut.symbol}
                className="w-4 h-4 rounded-full"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            )}
            <span>{selectedTokenOut?.symbol || 'Select'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>≈ ${usdValueOut} USD</span>
          {isQuoting && lastEditedField === 'IN' && (
            <span className="flex items-center gap-1 text-brand-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Calculating...</span>
            </span>
          )}
        </div>
      </div>

      {/* Quote Breakdown & Route Indicator */}
      {activeQuote && (
        <div className="p-3.5 rounded-2xl bg-dark-bg/60 border border-dark-border/80 space-y-2 text-xs font-mono animate-in fade-in">
          <div className="flex items-center justify-between text-slate-400">
            <span>Execution Rate:</span>
            <span className="text-slate-200 font-semibold">
              1 {selectedTokenIn?.symbol} ≈ {activeQuote.executionPrice} {selectedTokenOut?.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Minimum Received:</span>
            <span className="text-slate-200 font-semibold">
              {activeQuote.minAmountOutFormatted} {selectedTokenOut?.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Price Impact:</span>
            <span
              className={`font-semibold ${
                activeQuote.priceImpactPercent < 1
                  ? 'text-emerald-400'
                  : activeQuote.priceImpactPercent < 3
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {activeQuote.priceImpactPercent.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-dark-border/40">
            <span>Route Path:</span>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-400">
              {activeQuote.routePathSymbols.map((sym, idx) => (
                <React.Fragment key={idx}>
                  <span>{sym}</span>
                  {idx < activeQuote.routePathSymbols.length - 1 && (
                    <span className="text-slate-600">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {activeQuote.priceImpactPercent >= 5 && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-sans mt-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>High Price Impact ({activeQuote.priceImpactPercent.toFixed(1)}%):</strong> Pool reserves on testnet are limited. You will receive fewer tokens than benchmark market rates.
              </span>
            </div>
          )}
        </div>
      )}

      {quoteError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{quoteError}</span>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-2">
        {!amountIn || Number(amountIn) <= 0 ? (
          <button
            type="button"
            disabled
            className="w-full py-3.5 rounded-2xl bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-slate-700/50"
          >
            Enter An Amount
          </button>
        ) : isInsufficientBalance ? (
          <button
            type="button"
            disabled
            className="w-full py-3.5 rounded-2xl bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-rose-500/30"
          >
            Insufficient {selectedTokenIn?.symbol} Balance
          </button>
        ) : isAllowanceNeeded ? (
          <button
            type="button"
            onClick={onApproveClick}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Approve {selectedTokenIn?.symbol} Spending</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSwapClick}
            disabled={isQuoting}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {isQuoting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching Best Route...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Swap Tokens</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
