'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, ArrowRight } from 'lucide-react'
import { DexTokenItem } from '../swap.types'

interface SwapTxBannerProps {
  txHash: string | null
  txType: 'APPROVE' | 'SWAP' | null
  txStatus: 'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'
  explorerBaseUrl: string
  selectedTokenIn?: DexTokenItem | null
  lastExecutedSwap?: {
    tokenInSymbol: string
    tokenOutSymbol: string
    amountIn: string
    amountOut: string
  } | null
  onProceedToSwap: () => void
  onMakeAnotherSwap: () => void
}

export function SwapTxBanner({
  txHash,
  txType,
  txStatus,
  explorerBaseUrl,
  selectedTokenIn,
  lastExecutedSwap,
  onProceedToSwap,
  onMakeAnotherSwap,
}: SwapTxBannerProps) {
  if (!txHash) return null

  return (
    <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-3 shadow-xl animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {txStatus === 'confirmed' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : txStatus === 'failed' ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          )}
          <div>
            <h4 className="text-sm font-bold text-white">
              {txType === 'APPROVE'
                ? txStatus === 'confirmed'
                  ? `Step 1 Done: ${selectedTokenIn?.symbol} Approved!`
                  : txStatus === 'failed'
                  ? 'Approval Failed On-Chain'
                  : `Authorizing ${selectedTokenIn?.symbol} Approval...`
                : txStatus === 'confirmed'
                ? 'Swap Transaction Confirmed!'
                : txStatus === 'failed'
                ? 'Swap Failed On-Chain'
                : 'Swapping On-Chain...'}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              {txType === 'APPROVE' && txStatus === 'confirmed' ? (
                <span className="text-emerald-400 font-sans font-medium">
                  Step 2: You can now click &quot;Proceed to Swap Tokens&quot; below to execute your trade.
                </span>
              ) : (
                <>
                  Status: <span className="capitalize text-slate-200">{txStatus}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <a
          href={`${explorerBaseUrl}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition"
        >
          <span>Etherscan</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {txType === 'SWAP' && lastExecutedSwap && (
        <div className="p-3 rounded-xl bg-dark-bg/80 border border-dark-border/80 text-xs flex items-center justify-between font-mono">
          <span className="text-slate-300">
            {lastExecutedSwap.amountIn} {lastExecutedSwap.tokenInSymbol}
          </span>
          <span className="text-slate-500">➔</span>
          <span className="text-emerald-400 font-semibold">
            ~{lastExecutedSwap.amountOut} {lastExecutedSwap.tokenOutSymbol}
          </span>
        </div>
      )}

      {txType === 'APPROVE' && txStatus === 'confirmed' && (
        <button
          type="button"
          onClick={onProceedToSwap}
          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
        >
          <span>Proceed to Swap Tokens</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      {txType === 'SWAP' && txStatus === 'confirmed' && (
        <button
          type="button"
          onClick={onMakeAnotherSwap}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
        >
          Make Another Swap
        </button>
      )}
    </div>
  )
}
