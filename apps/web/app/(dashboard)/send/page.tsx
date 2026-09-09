'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Send,
  ArrowLeft,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Lock,
  ChevronDown,
} from 'lucide-react'
import { parseUnits, isAddress } from 'viem'
import { useVaultStore } from '@/lib/store/useVaultStore'
import {
  buildUnsignedTransaction,
  executeTransactionPipeline,
  fetchTxReceiptStatus,
  UnsignedEip1559Request,
  fetchWalletBalance,
} from '@/lib/crypto'
import { fetchMarketPrices, MarketPrices } from '@/lib/services/priceService'
import { fetchUserTokensAndBalances, TokenBalanceItem } from '@/lib/services/tokenService'
import { encodeTokenTransfer } from '@/lib/crypto/tokens/tokenEncoder'
import { VaultGate } from '@/components/VaultGate'

function SendContent() {
  const searchParams = useSearchParams()
  const initialTokenParam = searchParams.get('token')

  const { activeAddress, activeChainId } = useVaultStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [recipient, setRecipient] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null)

  // Tokens & Selected Asset state
  const [tokens, setTokens] = useState<TokenBalanceItem[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [selectedAssetAddress, setSelectedAssetAddress] = useState<string>('ETH')
  const [nativeBalance, setNativeBalance] = useState<string>('0')

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

  // Fetch Native Balance and Tokens on address or chain change
  useEffect(() => {
    if (!activeAddress) return

    let isMounted = true
    setIsLoadingTokens(true)

    fetchWalletBalance(activeAddress, activeChainId)
      .then((bal) => {
        if (isMounted) setNativeBalance(bal)
      })
      .catch(console.warn)

    fetchUserTokensAndBalances(activeAddress, activeChainId)
      .then((tokenList) => {
        if (isMounted) {
          setTokens(tokenList)
          // If URL param provided, select that token if present
          if (initialTokenParam) {
            const matched = tokenList.find(
              (t) => t.token.address.toLowerCase() === initialTokenParam.toLowerCase()
            )
            if (matched) {
              setSelectedAssetAddress(matched.token.address)
            }
          }
        }
      })
      .catch(console.warn)
      .finally(() => {
        if (isMounted) setIsLoadingTokens(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeAddress, activeChainId, initialTokenParam])

  const selectedTokenItem =
    selectedAssetAddress === 'ETH'
      ? null
      : tokens.find((t) => t.token.address.toLowerCase() === selectedAssetAddress.toLowerCase())

  const selectedToken = selectedTokenItem ? selectedTokenItem.token : null
  const isNative = selectedAssetAddress === 'ETH'
  const activeSymbol = isNative ? 'ETH' : selectedToken?.symbol || 'TOKEN'

  // Live gas estimation effect when recipient, amount, or selected asset change
  useEffect(() => {
    if (
      !activeAddress ||
      !recipient ||
      !amountInput ||
      isNaN(Number(amountInput)) ||
      Number(amountInput) <= 0
    ) {
      setGasEstimate(null)
      setPreparedTxRequest(null)
      return
    }

    if (!isAddress(recipient)) {
      setGasEstimate(null)
      setPreparedTxRequest(null)
      setErrorMsg('Please enter a valid 42-character EVM address.')
      return
    }

    const prepareTx = async () => {
      setIsEstimatingGas(true)
      setErrorMsg(null)

      try {
        if (isNative) {
          // Native ETH Transfer
          const { txRequest, gasSummary } = await buildUnsignedTransaction({
            from: activeAddress as `0x${string}`,
            to: recipient as `0x${string}`,
            valueEth: amountInput,
            chainId: activeChainId,
          })
          setPreparedTxRequest(txRequest)
          setGasEstimate(gasSummary)
        } else if (selectedToken && selectedTokenItem) {
          // ERC-20 Token Transfer
          const parsedTokenAmount = parseUnits(amountInput, selectedToken.decimals)
          const rawBalanceBigInt = BigInt(selectedTokenItem.rawBalance || '0')

          if (parsedTokenAmount > rawBalanceBigInt) {
            setErrorMsg(`Insufficient ${selectedToken.symbol} balance.`)
            setGasEstimate(null)
            setPreparedTxRequest(null)
            return
          }

          // Encode ERC-20 transfer(to, amount) calldata
          const transferCalldata = encodeTokenTransfer(
            recipient as `0x${string}`,
            parsedTokenAmount
          )

          // Transaction target is the TOKEN CONTRACT, value is 0 ETH
          const { txRequest, gasSummary } = await buildUnsignedTransaction({
            from: activeAddress as `0x${string}`,
            to: selectedToken.address,
            valueEth: '0',
            data: transferCalldata,
            chainId: activeChainId,
          })

          setPreparedTxRequest(txRequest)
          setGasEstimate(gasSummary)
        }
      } catch (err: any) {
        const rawMsg = err.message || ''
        if (rawMsg.toLowerCase().includes('insufficient funds')) {
          setErrorMsg('Insufficient ETH balance to pay required network gas fees.')
        } else {
          setErrorMsg(rawMsg || 'Failed to estimate gas or construct transaction payload.')
        }
        setGasEstimate(null)
        setPreparedTxRequest(null)
      } finally {
        setIsEstimatingGas(false)
      }
    }

    const timer = setTimeout(prepareTx, 450)
    return () => clearTimeout(timer)
  }, [
    activeAddress,
    recipient,
    amountInput,
    selectedAssetAddress,
    selectedToken,
    selectedTokenItem,
    activeChainId,
    isNative,
  ])

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
        valueEth: isNative ? amountInput : '0',
        tokenSymbol: isNative ? undefined : selectedToken?.symbol,
        tokenAmount: isNative ? undefined : amountInput,
        tokenAddress: isNative ? undefined : selectedToken?.address,
      })

      setBroadcastTxHash(broadcastTxHash)
      setTxStatus('broadcasted')
      setStep(3)
      setPasswordInput('')
    } catch (err: any) {
      const rawMsg = err.message || ''
      if (rawMsg.toLowerCase().includes('insufficient funds')) {
        setErrorMsg('Network rejected transaction: Insufficient ETH balance for gas fees.')
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
  }, [step, broadcastTxHash, activeChainId])

  const isMainnet = activeChainId === 1
  const ethPrice = marketPrices?.ethereumUsd || 2500

  // USD valuation calculation
  let usdAmount: string | null = null
  if (amountInput && !isNaN(Number(amountInput))) {
    if (isNative) {
      usdAmount = (Number(amountInput) * ethPrice).toFixed(2)
    } else if (selectedToken?.symbol === 'USDC' || selectedToken?.symbol === 'USDT') {
      usdAmount = Number(amountInput).toFixed(2)
    }
  }

  const handleSetMaxAmount = () => {
    if (isNative) {
      const numBal = Number(nativeBalance)
      const maxEth = Math.max(0, numBal - 0.003)
      setAmountInput(maxEth > 0 ? maxEth.toFixed(4) : '0')
    } else if (selectedTokenItem) {
      setAmountInput(selectedTokenItem.formattedBalance)
    }
  }

  return (
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
            <div
              className={`p-2.5 rounded-xl border ${
                isMainnet
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Send Assets</h1>
              <p className="text-xs text-slate-400">
                Native ETH & ERC-20 Tokens — Signed Offline in RAM
              </p>
            </div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold border ${
              isMainnet
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isMainnet ? 'Ξ Ethereum Mainnet' : '🧪 Sepolia Testnet'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
        <span className={step >= 1 ? 'text-emerald-400' : ''}>1. Select Asset & Input</span>
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
        <form
          onSubmit={handleProceedToReview}
          className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-5 shadow-xl"
        >
          {/* Asset Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Select Asset to Send</label>
            <div className="relative">
              <select
                value={selectedAssetAddress}
                onChange={(e) => {
                  setSelectedAssetAddress(e.target.value)
                  setAmountInput('')
                  setErrorMsg(null)
                }}
                className="w-full px-3.5 py-3 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer pr-10"
              >
                <option value="ETH">
                  Ethereum (ETH) — Balance: {Number(nativeBalance).toFixed(4)} ETH
                </option>
                {tokens.map((item) => (
                  <option key={item.token.address} value={item.token.address}>
                    {item.token.name} ({item.token.symbol}) — Balance: {item.formattedBalance} {item.token.symbol}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            {selectedToken && (
              <p className="text-[11px] font-mono text-slate-500 truncate">
                Contract: {selectedToken.address} ({selectedToken.decimals} decimals)
              </p>
            )}
          </div>

          {/* Recipient Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Recipient EVM Address</label>
            <input
              type="text"
              required
              placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Amount Input with MAX helper */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Amount ({activeSymbol})</label>
              <div className="flex items-center gap-2">
                {usdAmount && (
                  <span className="text-[11px] font-medium text-emerald-400 font-mono">
                    ≈ ${usdAmount} USD
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSetMaxAmount}
                  className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 transition"
                >
                  MAX
                </button>
              </div>
            </div>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
            />
            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Available Balance:</span>
              <span className="font-mono text-slate-300">
                {isNative
                  ? `${Number(nativeBalance).toFixed(4)} ETH`
                  : `${selectedTokenItem?.formattedBalance ?? '0'} ${selectedToken?.symbol}`}
              </span>
            </div>
          </div>

          {/* Gas & Fee Estimation preview */}
          {isEstimatingGas ? (
            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>
                {isNative
                  ? 'Estimating native EIP-1559 gas fees...'
                  : `Simulating ${activeSymbol} ERC-20 transfer & estimating gas...`}
              </span>
            </div>
          ) : gasEstimate ? (
            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Estimated Gas Units:</span>
                <span className="font-mono text-slate-200">
                  {gasEstimate.estimatedGasUnits} Gas Units
                  {!isNative && ' (ERC-20 Contract Call)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Fee / Priority Tip:</span>
                <span className="font-mono text-slate-200">
                  {(Number(gasEstimate.maxFeePerGas) / 1e9).toFixed(2)} /{' '}
                  {(Number(gasEstimate.maxPriorityFeePerGas) / 1e9).toFixed(2)} Gwei
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Gas Cost:</span>
                <span className="font-mono text-emerald-400">
                  {(Number(gasEstimate.estimatedTotalFeeWei) / 1e18).toFixed(6)} ETH
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
        <form
          onSubmit={handleConfirmAndSend}
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
                  {activeAddress?.slice(0, 8)}...{activeAddress?.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Address:</span>
                <span className="font-mono text-emerald-400">
                  {recipient.slice(0, 8)}...{recipient.slice(-6)}
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
                    {selectedToken.address.slice(0, 8)}...{selectedToken.address.slice(-6)}
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
              href={
                isMainnet
                  ? `https://etherscan.io/tx/${broadcastTxHash}`
                  : `https://sepolia.etherscan.io/tx/${broadcastTxHash}`
              }
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
  )
}

export default function SendPage() {
  return (
    <VaultGate>
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        }
      >
        <SendContent />
      </Suspense>
    </VaultGate>
  )
}
