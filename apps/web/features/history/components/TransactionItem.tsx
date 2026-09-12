'use client'

import React from 'react'
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Lock,
} from 'lucide-react'
import { ClientTxRecord } from '@/core/crypto'
import { truncateAddress, truncateHash } from '@/core'

export interface TransactionItemProps {
  tx: ClientTxRecord
  activeAddress: string | null
  explorerBaseUrl: string
}

export const TransactionItem = ({ tx, activeAddress, explorerBaseUrl }: TransactionItemProps) => {
  const isOutgoing = tx.from.toLowerCase() === activeAddress?.toLowerCase()
  const formattedDate = tx.createdAt
    ? new Date(tx.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent'

  const isSwap = Boolean(tx.tokenSymbol?.includes('→'))
  const isApproval = Boolean(tx.tokenAmount?.includes('Approve') || tx.tokenSymbol?.includes('Approve'))
  const isToken = Boolean(tx.tokenSymbol) && !isSwap && !isApproval
  const displaySymbol = tx.tokenSymbol || 'ETH'
  const displayAmount = tx.tokenAmount || tx.valueEth
  const actionLabel = isSwap
    ? `Swap ${tx.tokenSymbol}`
    : isApproval
    ? `Approved ${tx.tokenSymbol}`
    : isOutgoing
    ? `Sent ${displaySymbol}`
    : `Received ${displaySymbol}`

  return (
    <div className="py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-xl border ${
            isSwap
              ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
              : isApproval
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              : isOutgoing
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {isSwap ? (
            <ArrowLeftRight className="w-4 h-4" />
          ) : isApproval ? (
            <Lock className="w-4 h-4" />
          ) : isOutgoing ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownLeft className="w-4 h-4" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {actionLabel}
            </span>
            {isSwap ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono font-semibold">
                DEX Swap
              </span>
            ) : isApproval ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-semibold">
                Approval
              </span>
            ) : isToken ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-semibold">
                ERC-20
              </span>
            ) : null}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                tx.status === 'confirmed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : tx.status === 'failed'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {tx.status === 'confirmed' && <CheckCircle2 className="w-2.5 h-2.5 inline mr-1" />}
              {(tx.status === 'pending' || tx.status === 'broadcasted') && (
                <Clock className="w-2.5 h-2.5 inline mr-1 animate-spin" />
              )}
              {tx.status === 'failed' && <XCircle className="w-2.5 h-2.5 inline mr-1" />}
              {tx.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
            <span>
              {isOutgoing
                ? `To: ${truncateAddress(tx.to, 8, 6)}`
                : `From: ${truncateAddress(tx.from, 8, 6)}`}
            </span>
            <span>•</span>
            <span className="text-slate-500 font-sans">{formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="text-right space-y-1">
        <span
          className={`text-xs font-bold font-mono ${
            isOutgoing ? 'text-slate-200' : 'text-emerald-400'
          }`}
        >
          {isOutgoing ? '-' : '+'}{displayAmount} {displaySymbol}
        </span>
        <a
          href={`${explorerBaseUrl}/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-400 hover:text-emerald-400 transition flex items-center justify-end gap-1 font-mono"
        >
          <span>{truncateHash(tx.hash, 6, 4)}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
