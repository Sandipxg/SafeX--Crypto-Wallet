'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Send,
  ArrowDownLeft,
  History,
  Settings,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  Wallet,
  QrCode,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useVaultStore } from '@/lib/store/useVaultStore'
import { ChainSelector } from '@/components/ChainSelector'
import { VaultGate } from '@/components/VaultGate'
import { fetchWalletBalance } from '@/lib/crypto'
import { fetchMarketPrices, MarketPrices } from '@/lib/services/priceService'
import { TokenAssetsList } from '@/components/TokenAssetsList'

export default function DashboardPage() {
  const {
    activeAddress,
    activeBtcAddress,
    activeChainId,
    setActiveChainId,
    checkVaultExists,
  } = useVaultStore()

  const [activeChain, setActiveChain] = useState<string>(activeChainId === 1 ? 'ethereum' : 'sepolia')
  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [btcBalance, setBtcBalance] = useState<string>('0.00000000')
  const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null)
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)

  useEffect(() => {
    checkVaultExists()
  }, [checkVaultExists])

  // Sync chain selector with store activeChainId
  const handleChainChange = (chainIdStr: string) => {
    setActiveChain(chainIdStr)
    if (chainIdStr === 'ethereum') {
      setActiveChainId(1)
    } else if (chainIdStr === 'sepolia') {
      setActiveChainId(11155111)
    }
  }

  // Fetch live ETH balance with chainId & CoinGecko rates
  const fetchLiveBalance = async () => {
    if (!activeAddress) return
    setIsFetchingBalance(true)
    try {
      const [balance, prices] = await Promise.all([
        fetchWalletBalance(activeAddress, activeChainId),
        fetchMarketPrices(),
      ])
      setEthBalance(balance)
      setMarketPrices(prices)
    } catch (err) {
      console.error('[Dashboard] Balance query failed:', err)
      setEthBalance('0.0000')
    } finally {
      setIsFetchingBalance(false)
    }
  }

  useEffect(() => {
    if (activeAddress) {
      fetchLiveBalance()
    }
  }, [activeAddress, activeChainId])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const isBitcoin = activeChain === 'bitcoin'
  const isMainnet = activeChainId === 1

  // Dynamic rates and valuations based on selected chain
  const ethRate = marketPrices?.ethereumUsd || 2500
  const btcRate = marketPrices?.bitcoinUsd || 65000

  const activeRate = isBitcoin ? btcRate : ethRate
  const activeNativeBalanceStr = isBitcoin
    ? btcBalance
    : (ethBalance !== null ? Number(ethBalance).toFixed(4) : '0.0000')
  const activeSymbol = isBitcoin ? 'BTC' : 'ETH'
  const activeAddressDisplay = isBitcoin ? activeBtcAddress : activeAddress

  const activeNumericBalance = isBitcoin
    ? Number(btcBalance)
    : (ethBalance ? Number(ethBalance) : 0)

  const formattedUsdValue = (activeNumericBalance * activeRate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <VaultGate>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        {/* Top Header Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-dark-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SafeX Portfolio</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Encrypted Client Session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ChainSelector value={activeChain} onChange={handleChainChange} />

            <Link
              href="/settings"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-2 text-xs font-semibold shadow-sm"
              title="Security & Account Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>

        {/* The Single All-in-One Giant Wallet Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/80 border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-6">
          
          {/* Card Top: Asset & Network Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl border ${
                  isBitcoin
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {isBitcoin ? '₿' : 'Ξ'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {isBitcoin ? 'Bitcoin Native SegWit' : 'Ethereum (EVM)'}
                  </h2>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                      isBitcoin
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : isMainnet
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {isBitcoin
                      ? 'SegWit bech32'
                      : isMainnet
                      ? 'Mainnet'
                      : 'Sepolia Testnet'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {isBitcoin ? 'BIP-84 • m/84\'/0\'/0\'/0/0' : 'BIP-44 • m/44\'/60\'/0\'/0/0'}
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchLiveBalance}
              disabled={isFetchingBalance}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition shadow-sm"
              title="Sync Latest Balances"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingBalance ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Card Middle: Large Balance & Live Ticker */}
          <div className="space-y-2 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Balance
            </span>

            {/* Big USD Display */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                ${formattedUsdValue}
              </span>
              <span className="text-sm font-bold text-slate-400">USD</span>
            </div>

            {/* Native Balance & Spot Ticker */}
            <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="font-mono text-slate-200 font-semibold text-sm">
                {activeNativeBalanceStr} {activeSymbol}
              </span>
              <span className="text-slate-600">•</span>
              <div className={`flex items-center gap-1 font-mono ${isBitcoin ? 'text-amber-400' : 'text-emerald-400'}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>1 {activeSymbol} ≈ ${activeRate.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Card Inner: Integrated Public Address Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-bg/90 border border-dark-border/80 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Public Receiving Address
              </span>
              <span className="font-mono text-xs text-slate-200 truncate block">
                {activeAddressDisplay || 'Address not loaded'}
              </span>
            </div>

            {activeAddressDisplay && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeAddressDisplay)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                    hasCopied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Copy Address to Clipboard"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode((prev) => !prev)}
                  className={`p-2 rounded-xl border transition ${
                    showQrCode
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title={showQrCode ? 'Hide Deposit QR Code' : 'Show Deposit QR Code'}
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Inline Expandable QR Code Section */}
          {showQrCode && activeAddressDisplay && (
            <div className="p-6 rounded-2xl bg-dark-bg/95 border border-dark-border flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
                <QRCodeSVG value={activeAddressDisplay} size={150} level="M" marginSize={1} />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Deposit {activeSymbol}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Scan to Receive Funds
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Scan this QR code with your mobile wallet or exchange app to deposit funds directly to your SafeX address.
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeAddressDisplay)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 transition"
                  >
                    <span>Hide QR</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card Bottom: Action Buttons Row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Link
              href={isBitcoin ? '/receive' : '/send'}
              className={`py-3 px-4 rounded-xl text-white text-xs font-semibold transition shadow-lg flex items-center justify-center gap-2 ${
                isBitcoin
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              }`}
            >
              {isBitcoin ? <ArrowDownLeft className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>{isBitcoin ? 'Deposit BTC' : 'Send'}</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowQrCode((prev) => !prev)}
              className={`py-3 px-4 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 ${
                showQrCode
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>{showQrCode ? 'Hide QR' : 'Receive'}</span>
            </button>

            <Link
              href="/history"
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>
          </div>
        </div>

        {/* Multi-Asset Token Balances List (EVM) */}
        {!isBitcoin && activeAddress && (
          <TokenAssetsList
            walletAddress={activeAddress}
            chainId={activeChainId}
            nativeBalance={ethBalance !== null ? ethBalance : '0'}
            nativeUsdValue={formattedUsdValue}
          />
        )}

        {/* Security Summary Footer */}
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Zero-Trust Architecture: Private keys reside in RAM memory only and never leave this device.
            </span>
          </div>
          <Link
            href="/settings"
            className="text-brand-400 hover:underline font-semibold transition shrink-0"
          >
            Vault Security & Lock Controls →
          </Link>
        </div>
      </div>
    </VaultGate>
  )
}
