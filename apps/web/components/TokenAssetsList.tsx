'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Coins,
  Plus,
  Send,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { fetchUserTokensAndBalances, removeCustomToken } from '@/lib/services/tokenService'
import { TokenBalanceItem } from '@/lib/crypto/tokens/tokenTypes'
import { ImportTokenModal } from './ImportTokenModal'

interface TokenAssetsListProps {
  walletAddress: string
  chainId: number
  nativeBalance: string
  nativeUsdValue?: string | null
}

export function TokenAssetsList({
  walletAddress,
  chainId,
  nativeBalance,
  nativeUsdValue,
}: TokenAssetsListProps) {
  const [tokenBalances, setTokenBalances] = useState<TokenBalanceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false)

  // Receive Modal state
  const [receiveModalAsset, setReceiveModalAsset] = useState<{
    name: string
    symbol: string
    isNative?: boolean
  } | null>(null)

  const loadTokens = useCallback(async () => {
    if (!walletAddress) return
    setIsLoading(true)
    try {
      const items = await fetchUserTokensAndBalances(walletAddress, chainId)
      setTokenBalances(items)
    } catch (err) {
      console.warn('[SafeX] Failed to load token assets:', err)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress, chainId])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  const copyAddress = async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setHasCopiedAddress(true)
      setTimeout(() => setHasCopiedAddress(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDelete = async (tokenAddress: string, symbol: string) => {
    if (!confirm(`Remove ${symbol} from your wallet assets view?`)) return
    await removeCustomToken(tokenAddress, walletAddress, chainId)
    await loadTokens()
  }

  const isMainnet = chainId === 1
  const networkName = isMainnet ? 'Ethereum Mainnet' : 'Sepolia Testnet'
  const explorerBase = isMainnet ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'

  return (
    <div className="space-y-5">
      {/* ERC-20 Tokens Section (Small Cards Grid) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ERC-20 Token Assets</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {tokenBalances.length} Tracked
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTokens()}
              disabled={isLoading}
              className="p-2 rounded-xl bg-dark-card hover:bg-slate-800 border border-dark-border text-slate-400 hover:text-white transition disabled:opacity-50"
              title="Refresh Token Balances"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Token</span>
            </button>
          </div>
        </div>

        {/* Small Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tokenBalances.map((item) => {
            const hasPositiveBalance = Number(item.formattedBalance) > 0
            return (
              <div
                key={item.token.address}
                className="p-4 rounded-2xl bg-dark-card border border-dark-border hover:border-slate-700/80 transition-all shadow-md space-y-3 relative group"
              >
                {/* Card Top: Avatar, Symbol, Name & Custom tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {item.token.logoUri ? (
                      <img
                        src={item.token.logoUri}
                        alt={item.token.symbol}
                        className="w-8 h-8 rounded-xl object-contain bg-white/5 p-1 border border-dark-border shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-dark-border flex items-center justify-center text-xs font-bold text-emerald-400 font-mono shrink-0">
                        {item.token.symbol.slice(0, 3)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {item.token.symbol}
                        </span>
                        {item.token.isCustom && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.token.name}
                      </p>
                    </div>
                  </div>

                  {/* Contract link & Delete for custom */}
                  <div className="flex items-center gap-1">
                    <a
                      href={`${explorerBase}/token/${item.token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
                      title="View Contract on Explorer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {item.token.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.token.address, item.token.symbol)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                        title="Remove Token"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Middle: Balances & USD value */}
                <div className="bg-dark-bg/80 p-2.5 rounded-xl border border-dark-border/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Balance
                  </span>
                  <div className="flex items-baseline justify-between gap-2 mt-0.5">
                    <span
                      className={`text-sm font-bold font-mono truncate ${
                        hasPositiveBalance ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {Number(item.formattedBalance).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}{' '}
                      <span className="text-xs font-normal text-slate-400">{item.token.symbol}</span>
                    </span>

                    {item.usdValue && Number(item.usdValue) > 0 && (
                      <span className="text-[11px] text-emerald-400 font-mono shrink-0">
                        ${item.usdValue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Quick Actions */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <Link
                    href={`/send?token=${item.token.address}`}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3 text-emerald-400" />
                    <span>Send</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setReceiveModalAsset({
                        name: item.token.name,
                        symbol: item.token.symbol,
                        isNative: false,
                      })
                    }
                    className="py-1.5 px-2.5 rounded-xl bg-dark-bg hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-dark-border transition flex items-center justify-center gap-1"
                  >
                    <ArrowDownLeft className="w-3 h-3 text-blue-400" />
                    <span>Receive</span>
                  </button>
                </div>
              </div>
            )
          })}

          {/* "+ Import New Token" Card in the Grid */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-dark-card/40 hover:bg-slate-800/40 transition flex flex-col items-center justify-center gap-2 text-center group min-h-[150px]"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 border border-slate-700 group-hover:border-emerald-500/20 flex items-center justify-center transition">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition block">
                Import Token
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Paste any ERC-20 contract address
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Interactive Receive Modal */}
      {receiveModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-dark-card border border-dark-border p-6 shadow-2xl space-y-5 text-center relative">
            <button
              type="button"
              onClick={() => setReceiveModalAsset(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
                {networkName}
              </span>
              <h3 className="text-base font-bold text-white">
                Receive {receiveModalAsset.symbol}
              </h3>
              <p className="text-xs text-slate-400">
                Deposit {receiveModalAsset.name} to this wallet address
              </p>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-2xl shadow-xl w-fit mx-auto">
              <QRCodeSVG value={walletAddress} size={160} level="M" marginSize={1} />
            </div>

            {/* Address with Copy Button */}
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-dark-bg border border-dark-border font-mono text-xs text-slate-300 break-all select-all">
                {walletAddress}
              </div>

              <button
                type="button"
                onClick={copyAddress}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {hasCopiedAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Address Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Receiving Address</span>
                  </>
                )}
              </button>
            </div>

            {/* Important Notice */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                This address receives both native ETH and all ERC-20 tokens on {networkName}.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Import Token Modal */}
      <ImportTokenModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onTokenImported={loadTokens}
        walletAddress={walletAddress}
        chainId={chainId}
      />
    </div>
  )
}
