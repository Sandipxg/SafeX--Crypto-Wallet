'use client'

import React from 'react'
import { Shield, Lock, Loader2, AlertCircle } from 'lucide-react'
import { DexTokenItem, SwapQuoteInfo } from '../swap.types'

interface SwapAuthModalProps {
  mode: 'APPROVE' | 'SWAP' | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  passwordInput: string
  onPasswordChange: (val: string) => void
  isAuthorizing: boolean
  authError: string | null
  selectedTokenIn?: DexTokenItem | null
  selectedTokenOut?: DexTokenItem | null
  amountIn: string
  amountOut: string
  activeQuote?: SwapQuoteInfo | null
  slippageTolerance: number
}

export function SwapAuthModal({
  mode,
  onClose,
  onSubmit,
  passwordInput,
  onPasswordChange,
  isAuthorizing,
  authError,
  selectedTokenIn,
  selectedTokenOut,
  amountIn,
  amountOut,
  activeQuote,
  slippageTolerance,
}: SwapAuthModalProps) {
  if (!mode) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-dark-card border border-dark-border p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === 'APPROVE' ? 'Authorize Token Approval' : 'Authorize Swap Transaction'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Private keys reside in RAM only and never leave your device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-3.5 rounded-2xl bg-dark-bg border border-dark-border space-y-2 text-xs font-mono">
          {mode === 'APPROVE' ? (
            <>
              <div className="flex justify-between text-slate-400">
                <span>Action:</span>
                <span className="text-brand-400 font-semibold">ERC-20 Unlimited Approve</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Token:</span>
                <span className="text-slate-200">
                  {selectedTokenIn?.name} ({selectedTokenIn?.symbol})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Spender:</span>
                <span className="text-slate-200">Uniswap V2 Router02</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-slate-400">
                <span>You Pay:</span>
                <span className="text-rose-400 font-semibold">
                  {amountIn} {selectedTokenIn?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Expected Return:</span>
                <span className="text-emerald-400 font-semibold">
                  ~{amountOut || activeQuote?.expectedAmountOutFormatted} {selectedTokenOut?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Minimum Guaranteed:</span>
                <span className="text-slate-200">
                  {activeQuote?.minAmountOutFormatted} {selectedTokenOut?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Slippage:</span>
                <span className="text-slate-200">{slippageTolerance}%</span>
              </div>
            </>
          )}
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Vault Master Password</label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter your vault password"
              value={passwordInput}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAuthorizing || !passwordInput}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {isAuthorizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in RAM...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign & Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
