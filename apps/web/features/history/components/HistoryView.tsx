'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  History,
  ExternalLink,
  RefreshCw,
  Globe,
} from 'lucide-react'
import { useVaultStore, getExplorerBaseUrl, orpc } from '@/core'
import {
  ClientTxRecord,
  syncPendingClientTxs,
  getClientTxHistory,
  saveClientTx,
} from '@/core/crypto'
import { BackToDashboard } from '@/components/BackToDashboard'
import { TransactionItem } from './TransactionItem'

export const HistoryView = () => {
  const { activeAddress, activeChainId } = useVaultStore()

  const [transactions, setTransactions] = useState<ClientTxRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const explorerBaseUrl = getExplorerBaseUrl(activeChainId)

  const fetchHistory = async () => {
    if (!activeAddress) return
    setIsLoading(true)
    try {
      await syncPendingClientTxs(activeAddress).catch(() => {})
      const [localTxs, serverRes] = await Promise.all([
        getClientTxHistory(activeAddress, activeChainId).catch(() => [] as ClientTxRecord[]),
        orpc.history.getTransactions({ address: activeAddress, chainId: activeChainId }).catch(() => ({ transactions: [] })),
      ])

      const map = new Map<string, ClientTxRecord>()
      for (const tx of localTxs) {
        const key = tx.tokenAddress ? `${tx.hash}-${tx.tokenAddress}` : tx.hash
        map.set(key.toLowerCase(), tx)
      }
      for (const tx of serverRes.transactions) {
        const key = tx.tokenAddress ? `${tx.hash}-${tx.tokenAddress}` : tx.hash
        map.set(key.toLowerCase(), tx as ClientTxRecord)
        saveClientTx(tx as ClientTxRecord).catch(() => {})
      }

      const unified = Array.from(map.values())
      unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <BackToDashboard />

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
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.id || tx.hash}
                tx={tx}
                activeAddress={activeAddress}
                explorerBaseUrl={explorerBaseUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
