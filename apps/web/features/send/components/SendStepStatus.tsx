'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { getExplorerTxUrl } from '@/core'

interface SendStepStatusProps {
  txStatus: 'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'
  isMainnet: boolean
  broadcastTxHash: string
  amountInput: string
  activeSymbol: string
  onReset: () => void
}

export function SendStepStatus({
  txStatus,
  isMainnet,
  broadcastTxHash,
  amountInput,
  activeSymbol,
  onReset,
}: SendStepStatusProps) {
  return (
    <div className="p-6 rounded-2xl bg-dark-card border border-dark-border text-center space-y-6 shadow-xl">
      <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto border border-emerald-500/20">
        {txStatus === 'confirmed' ? (
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        ) : (
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-white">
          {txStatus === 'confirmed'
            ? `Transfer Confirmed on ${isMainnet ? 'Ethereum Mainnet' : 'Sepolia'}!`
            : 'Saved to Device IndexedDB — Broadcasted'}
        </h2>
        <p className="text-xs text-slate-400">
          {txStatus === 'confirmed'
            ? `Successfully sent ${amountInput} ${activeSymbol}.`
            : 'Your transaction is broadcasted and saved locally while pending inclusion.'}
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border text-xs space-y-1">
        <span className="text-[10px] text-slate-500 block">Transaction Hash (TxID)</span>
        <span className="font-mono text-emerald-400 break-all">{broadcastTxHash}</span>
      </div>

      <div className="pt-2 flex flex-col gap-3">
        <a
          href={getExplorerTxUrl(isMainnet ? 1 : 11155111, broadcastTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <span>View on {isMainnet ? 'Etherscan Mainnet' : 'Etherscan Sepolia'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-dark-border transition"
        >
          Send Another Transaction
        </button>

        <Link
          href="/history"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
        >
          Go to Transaction History
        </Link>
      </div>
    </div>
  )
}
