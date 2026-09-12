'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Send, ArrowLeft, AlertCircle } from 'lucide-react'
import { parseUnits, isAddress } from 'viem'
import { useVaultStore } from '@/core/store/useVaultStore'
import {
  buildUnsignedTransaction,
  executeTransactionPipeline,
  fetchTxReceiptStatus,
  UnsignedEip1559Request,
  fetchWalletBalance,
} from '@/core/crypto'
import { encodeTokenTransfer } from '@/core/crypto/tokens/tokenEncoder'
import { fetchUserTokensAndBalances, TokenBalanceItem } from '@/features/tokens'
import { usePrices } from '@/features/prices'

import { GasEstimateSummary } from '../send.types'
import { BackToDashboard } from '@/components/BackToDashboard'
import { SendStepDetails } from './SendStepDetails'
import { SendStepReview } from './SendStepReview'
import { SendStepStatus } from './SendStepStatus'

export function SendView() {
  const searchParams = useSearchParams()
  const initialTokenParam = searchParams.get('token')

  const { activeAddress, activeChainId } = useVaultStore()
  const { ethPrice } = usePrices()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [recipient, setRecipient] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  // Tokens & Selected Asset state
  const [tokens, setTokens] = useState<TokenBalanceItem[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [selectedAssetAddress, setSelectedAssetAddress] = useState<string>('ETH')
  const [nativeBalance, setNativeBalance] = useState<string>('0')

  // Transaction request & gas estimation state
  const [isEstimatingGas, setIsEstimatingGas] = useState(false)
  const [preparedTxRequest, setPreparedTxRequest] = useState<UnsignedEip1559Request | null>(null)
  const [gasEstimate, setGasEstimate] = useState<GasEstimateSummary | null>(null)

  // Status & error states
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSigningAndSending, setIsSigningAndSending] = useState(false)
  const [broadcastTxHash, setBroadcastTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<
    'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'
  >('broadcasted')

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

  // Live gas estimation effect
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
          const { txRequest, gasSummary } = await buildUnsignedTransaction({
            from: activeAddress as `0x${string}`,
            to: recipient as `0x${string}`,
            valueEth: amountInput,
            chainId: activeChainId,
          })
          setPreparedTxRequest(txRequest)
          setGasEstimate(gasSummary)
        } else if (selectedToken && selectedTokenItem) {
          const parsedTokenAmount = parseUnits(amountInput, selectedToken.decimals)
          const rawBalanceBigInt = BigInt(selectedTokenItem.rawBalance || '0')

          if (parsedTokenAmount > rawBalanceBigInt) {
            setErrorMsg(`Insufficient ${selectedToken.symbol} balance.`)
            setGasEstimate(null)
            setPreparedTxRequest(null)
            return
          }

          const transferCalldata = encodeTokenTransfer(
            recipient as `0x${string}`,
            parsedTokenAmount
          )

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

  // Step 2 -> Step 3 Sign & Broadcast
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

  const handleReset = () => {
    setStep(1)
    setAmountInput('')
    setRecipient('')
    setBroadcastTxHash(null)
    setGasEstimate(null)
    setPreparedTxRequest(null)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <BackToDashboard />

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
        <SendStepDetails
          selectedAssetAddress={selectedAssetAddress}
          onSelectedAssetChange={(addr) => {
            setSelectedAssetAddress(addr)
            setAmountInput('')
            setErrorMsg(null)
          }}
          recipient={recipient}
          onRecipientChange={(addr) => setRecipient(addr)}
          amountInput={amountInput}
          onAmountInputChange={setAmountInput}
          onSetMaxAmount={handleSetMaxAmount}
          nativeBalance={nativeBalance}
          tokens={tokens}
          selectedToken={selectedToken}
          selectedTokenItem={selectedTokenItem}
          isNative={isNative}
          activeSymbol={activeSymbol}
          usdAmount={usdAmount}
          isEstimatingGas={isEstimatingGas}
          gasEstimate={gasEstimate}
          preparedTxRequest={preparedTxRequest}
          onSubmit={handleProceedToReview}
        />
      )}

      {step === 2 && gasEstimate && (
        <SendStepReview
          activeAddress={activeAddress}
          recipient={recipient}
          amountInput={amountInput}
          activeSymbol={activeSymbol}
          usdAmount={usdAmount}
          isNative={isNative}
          selectedToken={selectedToken}
          gasEstimate={gasEstimate}
          passwordInput={passwordInput}
          onPasswordChange={setPasswordInput}
          isSigningAndSending={isSigningAndSending}
          onBack={() => setStep(1)}
          onSubmit={handleConfirmAndSend}
        />
      )}

      {step === 3 && broadcastTxHash && (
        <SendStepStatus
          txStatus={txStatus}
          isMainnet={isMainnet}
          broadcastTxHash={broadcastTxHash}
          amountInput={amountInput}
          activeSymbol={activeSymbol}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
