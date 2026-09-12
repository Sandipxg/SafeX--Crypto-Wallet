'use client'

import React from 'react'
import { Shield, Lock, Loader2 } from 'lucide-react'
import { TokenMetadata } from '@/core/crypto/tokens/tokenTypes'
import { truncateAddress } from '@/core'
import { GasEstimateSummary } from '../send.types'

interface SendStepReviewProps {
  activeAddress?: string | null
  recipient: string
  amountInput: string
  activeSymbol: string
  usdAmount: string | null
  isNative: boolean
  selectedToken: TokenMetadata | null
  gasEstimate: GasEstimateSummary
  passwordInput: string
  onPasswordChange: (val: string) => void
  isSigningAndSending: boolean
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function SendStepReview({
  activeAddress,
  recipient,
  amountInput,
  activeSymbol,
  usdAmount,
  isNative,
  selectedToken,
  gasEstimate,
  passwordInput,
  onPasswordChange,
  isSigningAndSending,
  onBack,
  onSubmit,
}: SendStepReviewProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-5 shadow-xl"
    >
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Review Transaction Summary</span>
        </h2>

        <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">From Address:</span>
            <span className="font-mono text-slate-300">
              {truncateAddress(activeAddress, 8, 6)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Recipient Address:</span>
            <span className="font-mono text-emerald-400">
              {truncateAddress(recipient, 8, 6)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Transfer Asset:</span>
            <div className="text-right">
              <span className="font-mono font-bold text-white block">
                {amountInput} {activeSymbol}
              </span>
              {usdAmount && (
                <span className="text-[10px] text-slate-400 block font-mono">
                  ≈ ${usdAmount} USD
                </span>
              )}
            </div>
          </div>

          {!isNative && selectedToken && (
            <div className="flex justify-between text-[11px] text-slate-400 border-t border-dark-border/60 pt-2">
              <span>Token Contract:</span>
              <span className="font-mono text-slate-300">
                {truncateAddress(selectedToken.address, 8, 6)}
              </span>
            </div>
          )}

          <div className="flex justify-between border-t border-dark-border pt-2 text-slate-400">
            <span>Max Network Gas Fee:</span>
            <span className="font-mono text-slate-300">
              {(Number(gasEstimate.estimatedTotalFeeWei) / 1e18).toFixed(6)} ETH
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Enter Wallet Password to Authorize Local Signing</span>
        </label>
        <input
          type="password"
          required
          value={passwordInput}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Enter password"
          className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-1/3 py-3 rounded-xl bg-dark-bg hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-dark-border transition"
        >
          Edit Details
        </button>
        <button
          type="submit"
          disabled={isSigningAndSending || !passwordInput}
          className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSigningAndSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing & Broadcasting...</span>
            </>
          ) : (
            <span>Sign Offline & Broadcast</span>
          )}
        </button>
      </div>
    </form>
  )
}
