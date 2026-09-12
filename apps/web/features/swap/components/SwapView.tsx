'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { parseUnits } from 'viem'
import { useVaultStore, getExplorerBaseUrl } from '@/core'
import {
  fetchWalletBalance,
  fetchTxReceiptStatus,
  executeTokenApproval,
  executeSwap,
  buildSwapTransactionWithFallback,
  checkTokenAllowance,
  queryOnChainQuote,
} from '@/core/crypto'
import { fetchUserTokensAndBalances, TokenBalanceItem } from '@/features/tokens'
import { usePrices } from '@/features/prices'
import { orpc } from '@/core'
import { VaultGate } from '@/components/VaultGate'
import { BackToDashboard } from '@/components/BackToDashboard'

import { DexTokenItem, SwapQuoteInfo, NATIVE_ETH_ADDRESS, DEFAULT_CHAIN_TOKENS } from '../swap.types'
import { TokenSelectModal } from './TokenSelectModal'
import { SlippageModal } from './SlippageModal'
import { SwapAuthModal } from './SwapAuthModal'
import { SwapTxBanner } from './SwapTxBanner'
import { SwapCard } from './SwapCard'

export function SwapView() {
  const { activeAddress, activeChainId } = useVaultStore()

  // Pre-seed available tokens immediately
  const defaultList = DEFAULT_CHAIN_TOKENS[activeChainId] || DEFAULT_CHAIN_TOKENS[11155111]
  const [availableTokens, setAvailableTokens] = useState<DexTokenItem[]>(defaultList)
  const [tokenInAddress, setTokenInAddress] = useState<string>(NATIVE_ETH_ADDRESS)
  const [tokenOutAddress, setTokenOutAddress] = useState<string>(
    defaultList[1]?.address || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  )

  // Amounts
  const [amountIn, setAmountIn] = useState<string>('')
  const [amountOut, setAmountOut] = useState<string>('')
  const [lastEditedField, setLastEditedField] = useState<'IN' | 'OUT'>('IN')

  // Prices hook
  const { ethPrice } = usePrices()

  // Modals state
  const [tokenSelectorTarget, setTokenSelectorTarget] = useState<'IN' | 'OUT' | null>(null)
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5)
  const [deadlineMinutes, setDeadlineMinutes] = useState<number>(20)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)

  // Quote State
  const [isQuoting, setIsQuoting] = useState<boolean>(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [activeQuote, setActiveQuote] = useState<SwapQuoteInfo | null>(null)

  // Allowance State
  const [currentAllowanceRaw, setCurrentAllowanceRaw] = useState<string>('0')
  const [routerAddress, setRouterAddress] = useState<`0x${string}`>(
    '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3'
  )

  // Auth Modal State
  const [authModalMode, setAuthModalMode] = useState<'APPROVE' | 'SWAP' | null>(null)
  const [passwordInput, setPasswordInput] = useState<string>('')
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Transaction Status
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txType, setTxType] = useState<'APPROVE' | 'SWAP' | null>(null)
  const [txStatus, setTxStatus] = useState<
    'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'
  >('broadcasted')
  const [lastExecutedSwap, setLastExecutedSwap] = useState<{
    tokenInSymbol: string
    tokenOutSymbol: string
    amountIn: string
    amountOut: string
  } | null>(null)

  const isMainnet = activeChainId === 1
  const explorerBaseUrl = getExplorerBaseUrl(activeChainId)

  // Update token list when activeChainId changes
  useEffect(() => {
    const list = DEFAULT_CHAIN_TOKENS[activeChainId] || DEFAULT_CHAIN_TOKENS[11155111]
    setAvailableTokens(list)
    setTokenInAddress(NATIVE_ETH_ADDRESS)
    if (list[1]) {
      setTokenOutAddress(list[1].address)
    }
  }, [activeChainId])

  // Sync on-chain user balances
  const syncBalancesAndTokens = useCallback(async () => {
    if (!activeAddress) return
    try {
      const [tokenConfigRes, bal, tokenList] = await Promise.all([
        orpc.wallet.getAvailableTokens({ chainId: activeChainId }).catch(() => null),
        fetchWalletBalance(activeAddress, activeChainId).catch(() => '0'),
        fetchUserTokensAndBalances(activeAddress, activeChainId).catch(
          () => [] as TokenBalanceItem[]
        ),
      ])

      const balancesMap: Record<string, string> = {
        [NATIVE_ETH_ADDRESS.toLowerCase()]: bal,
        eth: bal,
      }
      tokenList.forEach((t) => {
        balancesMap[t.token.address.toLowerCase()] = t.formattedBalance
      })

      const baseList =
        tokenConfigRes?.tokens && tokenConfigRes.tokens.length > 0
          ? tokenConfigRes.tokens
          : DEFAULT_CHAIN_TOKENS[activeChainId] || DEFAULT_CHAIN_TOKENS[11155111]

      if (tokenConfigRes?.config?.routerAddress) {
        setRouterAddress(tokenConfigRes.config.routerAddress)
      }

      const mergedTokens: DexTokenItem[] = baseList.map((t) => ({
        ...t,
        balance: t.isNative ? bal : balancesMap[t.address.toLowerCase()] ?? '0.00',
      }))

      setAvailableTokens(mergedTokens)
    } catch (err) {
      console.warn('[Swap] Background balance sync:', err)
    }
  }, [activeAddress, activeChainId])

  useEffect(() => {
    syncBalancesAndTokens()
  }, [syncBalancesAndTokens])

  // Selected Tokens Objects
  const selectedTokenIn = useMemo(() => {
    return (
      availableTokens.find((t) => t.address.toLowerCase() === tokenInAddress.toLowerCase()) ||
      availableTokens[0]
    )
  }, [availableTokens, tokenInAddress])

  const selectedTokenOut = useMemo(() => {
    return (
      availableTokens.find((t) => t.address.toLowerCase() === tokenOutAddress.toLowerCase()) ||
      availableTokens[1] ||
      null
    )
  }, [availableTokens, tokenOutAddress])

  // Check Token Allowance
  const checkAllowance = useCallback(async () => {
    if (!activeAddress || !selectedTokenIn || selectedTokenIn.isNative) {
      setCurrentAllowanceRaw(parseUnits('1000000000', 18).toString())
      return
    }

    try {
      const res = await checkTokenAllowance({
        tokenAddress: selectedTokenIn.address,
        ownerAddress: activeAddress,
        spenderAddress: routerAddress,
        chainId: activeChainId,
      })
      setCurrentAllowanceRaw(res.allowanceRaw)
    } catch {
      setCurrentAllowanceRaw('0')
    }
  }, [activeAddress, selectedTokenIn, routerAddress, activeChainId])

  useEffect(() => {
    checkAllowance()
  }, [checkAllowance])

  // Debounced Bidirectional Quote Calculation
  useEffect(() => {
    const activeAmount = lastEditedField === 'IN' ? amountIn : amountOut
    const trimmed = activeAmount ? activeAmount.trim() : ''
    const isCompleteValidNumber =
      Boolean(trimmed) &&
      !trimmed.endsWith('.') &&
      trimmed !== '0' &&
      !isNaN(Number(trimmed)) &&
      Number(trimmed) > 0

    if (!isCompleteValidNumber || !selectedTokenIn || !selectedTokenOut) {
      setActiveQuote(null)
      setQuoteError(null)
      setIsQuoting(false)
      if (!trimmed || trimmed === '0') {
        if (lastEditedField === 'IN') setAmountOut('')
        else setAmountIn('')
      }
      return
    }

    if (selectedTokenIn.address.toLowerCase() === selectedTokenOut.address.toLowerCase()) {
      setActiveQuote(null)
      setQuoteError('Cannot swap token for itself')
      setIsQuoting(false)
      return
    }

    let isCancelled = false
    setIsQuoting(true)
    setQuoteError(null)

    const timer = setTimeout(async () => {
      try {
        const quote = await orpc.wallet.getSwapQuote({
          tokenInAddress: selectedTokenIn.address,
          tokenOutAddress: selectedTokenOut.address,
          amountInFormatted: lastEditedField === 'IN' ? trimmed : undefined,
          amountOutFormatted: lastEditedField === 'OUT' ? trimmed : undefined,
          mode: lastEditedField === 'IN' ? 'EXACT_IN' : 'EXACT_OUT',
          slippageTolerancePercent: slippageTolerance,
          chainId: activeChainId,
        })

        if (!isCancelled) {
          if (lastEditedField === 'IN') {
            setAmountOut(quote.expectedAmountOutFormatted)
          } else {
            setAmountIn(quote.amountInFormatted)
          }

          setActiveQuote({
            minAmountOutRaw: quote.minAmountOutRaw,
            expectedAmountOutFormatted: quote.expectedAmountOutFormatted,
            minAmountOutFormatted: quote.minAmountOutFormatted,
            priceImpactPercent: quote.priceImpactPercent,
            routePathSymbols: quote.routePathSymbols,
            executionPrice: quote.executionPrice,
            isDirectRoute: quote.isDirectRoute,
            isSimulatedFallback: quote.isSimulatedFallback,
          })
          setIsQuoting(false)
        }
      } catch (serverErr) {
        // Dual-layer fallback: query directly from browser RPC
        try {
          const onChain = await queryOnChainQuote({
            tokenInAddress: selectedTokenIn.address,
            tokenOutAddress: selectedTokenOut.address,
            amountInFormatted: lastEditedField === 'IN' ? trimmed : '1',
            tokenInDecimals: selectedTokenIn.decimals,
            tokenOutDecimals: selectedTokenOut.decimals,
            tokenInSymbol: selectedTokenIn.symbol,
            tokenOutSymbol: selectedTokenOut.symbol,
            slippageTolerancePercent: slippageTolerance,
            chainId: activeChainId,
            routerAddress,
          })

          if (!isCancelled) {
            setAmountOut(onChain.expectedAmountOutFormatted)
            setActiveQuote({
              expectedAmountOutFormatted: onChain.expectedAmountOutFormatted,
              minAmountOutFormatted: onChain.minAmountOutFormatted,
              priceImpactPercent: onChain.priceImpactPercent,
              routePathSymbols: onChain.routePathSymbols,
              executionPrice: onChain.executionPrice,
              isDirectRoute: onChain.isDirectRoute,
              isSimulatedFallback: false,
            })
            setQuoteError(null)
            setIsQuoting(false)
          }
        } catch (chainErr) {
          if (!isCancelled) {
            setActiveQuote(null)
            if (lastEditedField === 'IN') setAmountOut('')
            const msg =
              chainErr instanceof Error && chainErr.message.includes('Insufficient')
                ? chainErr.message
                : 'Insufficient pool liquidity for this trade on Uniswap V2'
            setQuoteError(msg)
            setIsQuoting(false)
          }
        }
      }
    }, 400)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [
    amountIn,
    amountOut,
    lastEditedField,
    selectedTokenIn,
    selectedTokenOut,
    slippageTolerance,
    activeChainId,
    routerAddress,
  ])

  // Allowance check
  const isAllowanceNeeded = useMemo(() => {
    if (!selectedTokenIn || selectedTokenIn.isNative || !amountIn || Number(amountIn) <= 0) {
      return false
    }
    try {
      const requiredRaw = parseUnits(amountIn, selectedTokenIn.decimals)
      const currentRaw = BigInt(currentAllowanceRaw || '0')
      return currentRaw < requiredRaw
    } catch {
      return false
    }
  }, [selectedTokenIn, amountIn, currentAllowanceRaw])

  const userInBalance = selectedTokenIn?.balance ? Number(selectedTokenIn.balance) : 0
  const isInsufficientBalance = Number(amountIn) > userInBalance

  // Flip Tokens
  const handleFlipTokens = () => {
    if (!selectedTokenOut) return
    const prevIn = tokenInAddress
    const prevOut = tokenOutAddress
    setTokenInAddress(prevOut)
    setTokenOutAddress(prevIn)
    setAmountIn(amountOut)
    setAmountOut('')
    setLastEditedField('IN')
  }

  // Handle Token Selection
  const handleSelectToken = (token: DexTokenItem) => {
    if (tokenSelectorTarget === 'IN') {
      if (token.address.toLowerCase() === tokenOutAddress.toLowerCase()) {
        handleFlipTokens()
      } else {
        setTokenInAddress(token.address)
      }
    } else if (tokenSelectorTarget === 'OUT') {
      if (token.address.toLowerCase() === tokenInAddress.toLowerCase()) {
        handleFlipTokens()
      } else {
        setTokenOutAddress(token.address)
      }
    }
    setTokenSelectorTarget(null)
  }

  // Execute Approval
  const handleExecuteApproval = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress || !selectedTokenIn || !passwordInput) return

    setIsAuthorizing(true)
    setAuthError(null)

    try {
      const result = await executeTokenApproval({
        password: passwordInput,
        ownerAddress: activeAddress,
        tokenAddress: selectedTokenIn.address,
        tokenSymbol: selectedTokenIn.symbol,
        spenderAddress: routerAddress,
        chainId: activeChainId,
      })

      setTxHash(result.broadcastTxHash)
      setTxType('APPROVE')
      setTxStatus('broadcasted')
      setAuthModalMode(null)
      setPasswordInput('')

      let pollCount = 0
      const pollTimer = setInterval(async () => {
        pollCount++
        await checkAllowance()
        if (pollCount >= 8) clearInterval(pollTimer)
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval authorization failed'
      setAuthError(msg)
    } finally {
      setIsAuthorizing(false)
    }
  }

  // Execute Swap
  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress || !selectedTokenIn || !selectedTokenOut || !amountIn || !passwordInput) {
      return
    }

    setIsAuthorizing(true)
    setAuthError(null)

    try {
      const preparedTx = await buildSwapTransactionWithFallback({
        userAddress: activeAddress,
        tokenInAddress: selectedTokenIn.address,
        tokenOutAddress: selectedTokenOut.address,
        amountInFormatted: amountIn,
        slippageTolerancePercent: slippageTolerance,
        deadlineMinutes,
        chainId: activeChainId,
        routerAddress,
        expectedMinOutRaw: activeQuote?.minAmountOutRaw,
        tokenInDecimals: selectedTokenIn.decimals,
        tokenOutDecimals: selectedTokenOut.decimals,
      })

      const result = await executeSwap({
        password: passwordInput,
        preparedTx,
        from: activeAddress,
        tokenInSymbol: selectedTokenIn.symbol,
        tokenOutSymbol: selectedTokenOut.symbol,
        tokenInAmount: amountIn,
        tokenOutAmount: amountOut || activeQuote?.expectedAmountOutFormatted || '0',
      })

      setLastExecutedSwap({
        tokenInSymbol: selectedTokenIn.symbol,
        tokenOutSymbol: selectedTokenOut.symbol,
        amountIn,
        amountOut: amountOut || activeQuote?.expectedAmountOutFormatted || '0',
      })

      setTxHash(result.broadcastTxHash)
      setTxType('SWAP')
      setTxStatus('broadcasted')
      setAuthModalMode(null)
      setPasswordInput('')

      setTimeout(() => {
        syncBalancesAndTokens()
        checkAllowance()
      }, 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Swap execution failed'
      setAuthError(msg)
    } finally {
      setIsAuthorizing(false)
    }
  }

  // Receipt Mining Poller
  useEffect(() => {
    if (!txHash) return

    let isMounted = true
    const interval = setInterval(async () => {
      try {
        const status = await fetchTxReceiptStatus(txHash, activeChainId)
        if (isMounted) {
          setTxStatus(status)
          if (status === 'confirmed' || status === 'failed' || status === 'dropped') {
            clearInterval(interval)
            syncBalancesAndTokens()
            checkAllowance()
          }
        }
      } catch {
        // Keep polling
      }
    }, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [txHash, activeChainId, syncBalancesAndTokens, checkAllowance])

  // USD values
  const usdValueIn = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0) return '0.00'
    const num = Number(amountIn)
    if (selectedTokenIn?.symbol === 'ETH' || selectedTokenIn?.symbol === 'WETH') {
      return (num * ethPrice).toFixed(2)
    }
    if (
      selectedTokenIn?.symbol === 'USDC' ||
      selectedTokenIn?.symbol === 'USDT' ||
      selectedTokenIn?.symbol === 'DAI'
    ) {
      return num.toFixed(2)
    }
    return (num * 15).toFixed(2)
  }, [amountIn, selectedTokenIn, ethPrice])

  const usdValueOut = useMemo(() => {
    if (!amountOut || Number(amountOut) <= 0) return '0.00'
    const num = Number(amountOut)
    if (selectedTokenOut?.symbol === 'ETH' || selectedTokenOut?.symbol === 'WETH') {
      return (num * ethPrice).toFixed(2)
    }
    if (
      selectedTokenOut?.symbol === 'USDC' ||
      selectedTokenOut?.symbol === 'USDT' ||
      selectedTokenOut?.symbol === 'DAI'
    ) {
      return num.toFixed(2)
    }
    return (num * 15).toFixed(2)
  }, [amountOut, selectedTokenOut, ethPrice])

  return (
    <VaultGate>
      <div className="max-w-xl mx-auto py-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <BackToDashboard />

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
              isMainnet
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isMainnet ? 'Ξ Ethereum Mainnet' : '🧪 Sepolia Testnet'}
          </span>
        </div>

        {/* Transaction Banner */}
        <SwapTxBanner
          txHash={txHash}
          txType={txType}
          txStatus={txStatus}
          explorerBaseUrl={explorerBaseUrl}
          selectedTokenIn={selectedTokenIn}
          lastExecutedSwap={lastExecutedSwap}
          onProceedToSwap={() => {
            setTxHash(null)
            setTxType(null)
            checkAllowance()
            setAuthError(null)
            setAuthModalMode('SWAP')
          }}
          onMakeAnotherSwap={() => {
            setTxHash(null)
            setTxType(null)
            setAmountIn('')
            setAmountOut('')
            setActiveQuote(null)
            setLastExecutedSwap(null)
          }}
        />

        {/* Core Swap Card */}
        <SwapCard
          amountIn={amountIn}
          onAmountInChange={(val) => {
            setAmountIn(val)
            setLastEditedField('IN')
          }}
          amountOut={amountOut}
          onAmountOutChange={(val) => {
            setAmountOut(val)
            setLastEditedField('OUT')
          }}
          selectedTokenIn={selectedTokenIn}
          selectedTokenOut={selectedTokenOut}
          onOpenTokenSelector={(target) => setTokenSelectorTarget(target)}
          onFlipTokens={handleFlipTokens}
          usdValueIn={usdValueIn}
          usdValueOut={usdValueOut}
          isQuoting={isQuoting}
          lastEditedField={lastEditedField}
          activeQuote={activeQuote}
          quoteError={quoteError}
          isInsufficientBalance={isInsufficientBalance}
          isAllowanceNeeded={isAllowanceNeeded}
          slippageTolerance={slippageTolerance}
          onOpenSettings={() => setShowSettingsModal(true)}
          onApproveClick={() => setAuthModalMode('APPROVE')}
          onSwapClick={() => setAuthModalMode('SWAP')}
        />

        {/* Token Selection Modal */}
        <TokenSelectModal
          isOpen={Boolean(tokenSelectorTarget)}
          onClose={() => setTokenSelectorTarget(null)}
          onSelectToken={handleSelectToken}
          availableTokens={availableTokens}
          selectedTokenAddress={
            tokenSelectorTarget === 'IN' ? tokenInAddress : tokenOutAddress
          }
        />

        {/* Slippage Settings Modal */}
        <SlippageModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          slippageTolerance={slippageTolerance}
          onSlippageChange={setSlippageTolerance}
          deadlineMinutes={deadlineMinutes}
          onDeadlineChange={setDeadlineMinutes}
        />

        {/* Authentication Modal */}
        <SwapAuthModal
          mode={authModalMode}
          onClose={() => {
            setAuthModalMode(null)
            setPasswordInput('')
            setAuthError(null)
          }}
          onSubmit={authModalMode === 'APPROVE' ? handleExecuteApproval : handleExecuteSwap}
          passwordInput={passwordInput}
          onPasswordChange={setPasswordInput}
          isAuthorizing={isAuthorizing}
          authError={authError}
          selectedTokenIn={selectedTokenIn}
          selectedTokenOut={selectedTokenOut}
          amountIn={amountIn}
          amountOut={amountOut}
          activeQuote={activeQuote}
          slippageTolerance={slippageTolerance}
        />
      </div>
    </VaultGate>
  )
}
