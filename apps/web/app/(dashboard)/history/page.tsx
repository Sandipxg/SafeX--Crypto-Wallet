'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  History,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Database,
  Globe,
  ArrowLeftRight,
  Lock,
} from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'
import { ClientTxRecord, syncPendingClientTxs } from '@/lib/crypto'
import { getUnifiedHistory } from '@/lib/services/historyService'
import { VaultGate } from '@/components/VaultGate'

export default function HistoryPage() {
  const { activeAddress, activeChainId } = useVaultStore()

  const [transactions, setTransactions] = useState<ClientTxRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isMainnet = activeChainId === 1
  const explorerBaseUrl = isMainnet ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'

  const fetchHistory = async () => {
    if (!activeAddress) return
    setIsLoading(true)
    try {
      await syncPendingClientTxs(activeAddress).catch(() => {})
      const unified = await getUnifiedHistory(activeAddress, activeChainId)
      setTransactions(unified)
    } catch (err) {
      console.error('[History] Failed to query unified history:', err)
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [activeAddress, activeChainId])

  return (
    <VaultGate>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Top Header Card */}
        <div className="p-6 rounded-2xl bg-dark-card border border-dark-border flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Activity & History</h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" /> On-Chain + Local Cache
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live blockchain transactions synced from network explorers (MetaMask / Trust Wallet pattern)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {activeAddress && (
              <a
                href={`${explorerBaseUrl}/address/${activeAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                title="View full account transactions on Etherscan"
              >
                <span>Etherscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="p-6 rounded-2xl bg-dark-card border border-dark-border shadow-xl space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mx-auto" />
              <p>Syncing on-chain transactions from network explorer...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No Transactions Found</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                No on-chain activity has been detected for this address yet. Receive testnet ETH from a faucet or send a transaction to see records appear here.
              </p>
              {activeAddress && (
                <a
                  href={`${explorerBaseUrl}/address/${activeAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline pt-2"
                >
                  <span>Check directly on Etherscan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="divide-y divide-dark-border/60">
              {transactions.map((tx) => {
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
                  <div key={tx.id || tx.hash} className="py-4 flex flex-wrap items-center justify-between gap-4">
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
                              ? `To: ${tx.to.slice(0, 8)}...${tx.to.slice(-6)}`
                              : `From: ${tx.from.slice(0, 8)}...${tx.from.slice(-6)}`}
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
                        <span>{tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </VaultGate>
  )
}
