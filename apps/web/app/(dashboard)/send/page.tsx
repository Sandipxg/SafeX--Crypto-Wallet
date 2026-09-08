'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Send, ArrowLeft, Shield, AlertCircle, CheckCircle2, Loader2, ExternalLink, Lock, DollarSign } from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'
import {
  buildUnsignedTransaction,
  executeTransactionPipeline,
  fetchTxReceiptStatus,
  UnsignedEip1559Request,
} from '@/lib/crypto'
import { fetchMarketPrices, MarketPrices } from '@/lib/services/priceService'
import { VaultGate } from '@/components/VaultGate'

export default function SendPage() {
  const { activeAddress, activeChainId } = useVaultStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [recipient, setRecipient] = useState('')
  const [amountEth, setAmountEth] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null)

  // Transaction request & gas estimation state
  const [isEstimatingGas, setIsEstimatingGas] = useState(false)
  const [preparedTxRequest, setPreparedTxRequest] = useState<UnsignedEip1559Request | null>(null)
  const [gasEstimate, setGasEstimate] = useState<{
    maxFeePerGas: string
    maxPriorityFeePerGas: string
    estimatedGasUnits: string
    estimatedTotalFeeWei: string
  } | null>(null)

  // Status & error states
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSigningAndSending, setIsSigningAndSending] = useState(false)
  const [broadcastTxHash, setBroadcastTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'>('broadcasted')

  // Fetch ETH market price rate on load
  useEffect(() => {
    fetchMarketPrices().then(setMarketPrices).catch(console.warn)
  }, [])

  // Live gas estimation effect when recipient & amount change
  useEffect(() => {
    if (!activeAddress || !recipient || !amountEth || isNaN(Number(amountEth)) || Number(amountEth) <= 0) {
      setGasEstimate(null)
      setPreparedTxRequest(null)
      return
    }

    const prepareTx = async () => {
      setIsEstimatingGas(true)
      setErrorMsg(null)
      try {
        const { txRequest, gasSummary } = await buildUnsignedTransaction({
          from: activeAddress as `0x${string}`,
          to: recipient as `0x${string}`,
          valueEth: amountEth,
          chainId: activeChainId,
        })

        setPreparedTxRequest(txRequest)
        setGasEstimate(gasSummary)
      } catch (err: any) {
        const rawMsg = err.message || ''
        if (rawMsg.toLowerCase().includes('insufficient funds')) {
          setErrorMsg('Insufficient balance in wallet to cover amount and gas fees.')
        } else {
          setErrorMsg(rawMsg || 'Failed to estimate gas or validate recipient address.')
        }
        setGasEstimate(null)
        setPreparedTxRequest(null)
      } finally {
        setIsEstimatingGas(false)
      }
    }

    const timer = setTimeout(prepareTx, 500)
    return () => clearTimeout(timer)
  }, [activeAddress, recipient, amountEth, activeChainId])

  // Step 1 -> Step 2 Review
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gasEstimate || !preparedTxRequest) {
      setErrorMsg('Valid gas estimate and recipient address required before proceeding.')
      return
    }
    setErrorMsg(null)
    setStep(2)
  }

  // Step 2 -> Step 3 Sign, Save to Client IndexedDB, & Broadcast via Pipeline Service
  const handleConfirmAndSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress || !gasEstimate || !preparedTxRequest) return

    setIsSigningAndSending(true)
    setErrorMsg(null)

    try {
      const { broadcastTxHash } = await executeTransactionPipeline({
        password: passwordInput,
        preparedTxRequest,
        from: activeAddress as `0x${string}`,
        to: recipient as `0x${string}`,
        valueEth: amountEth,
      })

      setBroadcastTxHash(broadcastTxHash)
      setTxStatus('broadcasted')
      setStep(3)
      setPasswordInput('')
    } catch (err: any) {
      const rawMsg = err.message || ''
      if (rawMsg.toLowerCase().includes('insufficient funds')) {
        setErrorMsg('Network rejected transaction: Insufficient balance for value + gas fee.')
      } else {
        setErrorMsg(rawMsg || 'Failed to sign or broadcast transaction.')
      }
    } finally {
      setIsSigningAndSending(false)
    }
  }

  // Poll transaction receipt status on Step 3 UI
  useEffect(() => {
    if (step !== 3 || !broadcastTxHash) return

    const pollInterval = setInterval(async () => {
      try {
        const status = await fetchTxReceiptStatus(broadcastTxHash, activeChainId)
        if (status !== 'pending') {
          setTxStatus(status)
          clearInterval(pollInterval)
        }
      } catch {
        // Continue polling until receipt appears
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [step, broadcastTxHash])

  const isMainnet = activeChainId === 1
  const ethPrice = marketPrices?.ethereumUsd || 2500
  const usdAmount = amountEth && !isNaN(Number(amountEth)) ? (Number(amountEth) * ethPrice).toFixed(2) : null

  return (
    <VaultGate>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-2 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isMainnet ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Send {isMainnet ? 'Ethereum (Mainnet)' : 'Sepolia ETH'}
              </h1>
              <p className="text-xs text-slate-400">Local-First Client Transaction Signer (Trust Wallet Pattern)</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold border ${isMainnet ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {isMainnet ? 'Ξ Ethereum Mainnet' : '🧪 Sepolia Testnet'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
        <span className={step >= 1 ? 'text-emerald-400' : ''}>1. Transaction Input</span>
        <span className={step >= 2 ? 'text-emerald-400' : ''}>2. Review & Authorize</span>
        <span className={step >= 3 ? 'text-emerald-400' : ''}>3. Broadcast & Status</span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleProceedToReview} className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-5 shadow-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Recipient EVM Address</label>
            <input
              type="text"
              required
              placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Amount (ETH)</label>
              {usdAmount && (
                <span className="text-[11px] font-medium text-emerald-400 font-mono">
                  ≈ ${usdAmount} USD
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              required
              placeholder="0.01"
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {isEstimatingGas ? (
            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Estimating EIP-1559 gas fees and querying nonce...</span>
            </div>
          ) : gasEstimate ? (
            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Estimated Gas Units:</span>
                <span className="font-mono text-slate-200">{gasEstimate.estimatedGasUnits} Gas</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Fee / Priority Tip:</span>
                <span className="font-mono text-slate-200">
                  {(Number(gasEstimate.maxFeePerGas) / 1e9).toFixed(2)} / {(Number(gasEstimate.maxPriorityFeePerGas) / 1e9).toFixed(2)} Gwei
                </span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-400 pt-1 border-t border-dark-border">
                <span>Account Nonce:</span>
                <span className="font-mono">#{preparedTxRequest?.nonce ?? 0}</span>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!gasEstimate || isEstimatingGas}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review Transaction
          </button>
        </form>
      )}

      {step === 2 && gasEstimate && (
        <form onSubmit={handleConfirmAndSend} className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-5 shadow-xl">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Review Transaction Summary</span>
            </h2>

            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">From Address:</span>
                <span className="font-mono text-slate-300">{activeAddress?.slice(0, 8)}...{activeAddress?.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Address:</span>
                <span className="font-mono text-emerald-400">{recipient.slice(0, 8)}...{recipient.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transfer Amount:</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-white block">{amountEth} ETH</span>
                  {usdAmount && (
                    <span className="text-[10px] text-slate-400 block font-mono">≈ ${usdAmount} USD</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between border-t border-dark-border pt-2 text-slate-400">
                <span>Estimated Max Gas Fee:</span>
                <span className="font-mono text-slate-300">{(Number(gasEstimate.estimatedTotalFeeWei) / 1e18).toFixed(6)} ETH</span>
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
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
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
      )}

      {step === 3 && broadcastTxHash && (
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
                ? `Transaction Confirmed on ${isMainnet ? 'Ethereum Mainnet' : 'Sepolia'}!`
                : 'Saved to Device IndexedDB — Broadcasted'}
            </h2>
            <p className="text-xs text-slate-400">
              {txStatus === 'confirmed'
                ? 'The transaction has been mined into a block successfully.'
                : 'Your transaction record is stored in local browser storage while pending.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border text-xs space-y-1">
            <span className="text-[10px] text-slate-500 block">Transaction Hash (TxID)</span>
            <span className="font-mono text-emerald-400 break-all">{broadcastTxHash}</span>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <a
              href={isMainnet ? `https://etherscan.io/tx/${broadcastTxHash}` : `https://sepolia.etherscan.io/tx/${broadcastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <span>View on {isMainnet ? 'Etherscan Mainnet' : 'Etherscan Sepolia'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
            >
              Go to Transaction History
            </Link>
          </div>
        </div>
      )}
      </div>
    </VaultGate>
  )
}
