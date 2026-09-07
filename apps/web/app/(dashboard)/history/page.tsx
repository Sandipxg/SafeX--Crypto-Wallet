'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, History, ExternalLink, RefreshCw, CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownLeft, Database } from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'
import { getClientTxHistory, ClientTxRecord, syncPendingClientTxs } from '@/lib/crypto'

export default function HistoryPage() {
  const { activeAddress } = useVaultStore()

  const [transactions, setTransactions] = useState<ClientTxRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchHistory = async () => {
    if (!activeAddress) return
    setIsLoading(true)
    try {
      await syncPendingClientTxs(activeAddress)
      const localTxs = await getClientTxHistory(activeAddress, 11155111)
      setTransactions(localTxs)
    } catch {
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [activeAddress])

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="p-6 rounded-2xl bg-dark-card border border-dark-border flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Transaction History</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <Database className="w-2.5 h-2.5" /> Client IndexedDB
              </span>
            </div>
            <p className="text-xs text-slate-400">Local-First Device Transaction Database (Trust Wallet Pattern)</p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync & Refresh</span>
        </button>
      </div>

      {/* History Table */}
      <div className="p-6 rounded-2xl bg-dark-card border border-dark-border shadow-xl space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading local IndexedDB transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No Local Transactions Recorded</p>
            <p className="text-[11px] text-slate-500">
              Send testnet ETH from the Send screen to store local EIP-1559 records in browser IndexedDB.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border/60">
            {transactions.map((tx) => {
              const isOutgoing = tx.from.toLowerCase() === activeAddress?.toLowerCase()

              return (
                <div key={tx.hash} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isOutgoing
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {isOutgoing ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {isOutgoing ? 'Send ETH' : 'Receive ETH'}
                        </span>
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
                          {tx.status === 'pending' || tx.status === 'broadcasted' ? <Clock className="w-2.5 h-2.5 inline mr-1 animate-spin" /> : null}
                          {tx.status === 'failed' && <XCircle className="w-2.5 h-2.5 inline mr-1" />}
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        {isOutgoing ? `To: ${tx.to.slice(0, 8)}...${tx.to.slice(-6)}` : `From: ${tx.from.slice(0, 8)}...${tx.from.slice(-6)}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`text-xs font-bold font-mono ${isOutgoing ? 'text-slate-200' : 'text-emerald-400'}`}>
                      {isOutgoing ? '-' : '+'}{tx.valueEth} ETH
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
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
  )
}
