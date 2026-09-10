'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownUp,
  Settings2,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Lock,
  ChevronDown,
  Sparkles,
  Zap,
  Search,
  Check,
} from 'lucide-react'
import { parseUnits } from 'viem'
import { useVaultStore } from '@/lib/store/useVaultStore'
import {
  fetchWalletBalance,
  fetchTxReceiptStatus,
  executeTokenApproval,
  executeSwap,
  buildSwapTransactionWithFallback,
  checkTokenAllowance,
  queryOnChainQuote,
} from '@/lib/crypto'
import { fetchUserTokensAndBalances, TokenBalanceItem } from '@/lib/services/tokenService'
import { fetchMarketPrices, MarketPrices } from '@/lib/services/priceService'
import { orpc } from '@/lib/orpc'
import { VaultGate } from '@/components/VaultGate'

export interface DexTokenItem {
  address: `0x${string}`
  name: string
  symbol: string
  decimals: number
  isNative?: boolean
  logoUri?: string
  balance?: string
}

const NATIVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const

const DEFAULT_CHAIN_TOKENS: Record<number, DexTokenItem[]> = {
  // Sepolia Testnet (11155111)
  11155111: [
    {
      address: NATIVE_ETH_ADDRESS,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      balance: '0.0000',
    },
    {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      name: 'USD Coin (Testnet)',
      symbol: 'USDC',
      decimals: 6,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      balance: '0.00',
    },
    {
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      name: 'ChainLink Token',
      symbol: 'LINK',
      decimals: 18,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
      balance: '0.00',
    },
    {
      address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      balance: '0.00',
    },
  ],
  // Ethereum Mainnet (1)
  1: [
    {
      address: NATIVE_ETH_ADDRESS,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      balance: '0.0000',
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      balance: '0.00',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      balance: '0.00',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      balance: '0.00',
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      balance: '0.00',
    },
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      balance: '0.00',
    },
  ],
}

export default function SwapPage() {
  const { activeAddress, activeChainId } = useVaultStore()

  // Pre-seed available tokens immediately so lists are never blank
  const defaultList = DEFAULT_CHAIN_TOKENS[activeChainId] || DEFAULT_CHAIN_TOKENS[11155111]
  const [availableTokens, setAvailableTokens] = useState<DexTokenItem[]>(defaultList)
  const [tokenInAddress, setTokenInAddress] = useState<string>(NATIVE_ETH_ADDRESS)
  const [tokenOutAddress, setTokenOutAddress] = useState<string>(defaultList[1]?.address || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238')

  // Bidirectional amount states
  const [amountIn, setAmountIn] = useState<string>('')
  const [amountOut, setAmountOut] = useState<string>('')
  const [lastEditedField, setLastEditedField] = useState<'IN' | 'OUT'>('IN')

  // Balances & Prices
  const [nativeBalance, setNativeBalance] = useState<string>('0')
  const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null)

  // Token Selector Modal State
  const [tokenSelectorTarget, setTokenSelectorTarget] = useState<'IN' | 'OUT' | null>(null)
  const [tokenSearchQuery, setTokenSearchQuery] = useState<string>('')

  // Settings Modal State
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5)
  const [customSlippage, setCustomSlippage] = useState<string>('')
  const [deadlineMinutes, setDeadlineMinutes] = useState<number>(20)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)

  // Quote State
  const [isQuoting, setIsQuoting] = useState<boolean>(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [activeQuote, setActiveQuote] = useState<{
    expectedAmountOutFormatted: string
    minAmountOutFormatted: string
    priceImpactPercent: number
    routePathSymbols: string[]
    executionPrice: string
    isDirectRoute: boolean
    isSimulatedFallback: boolean
  } | null>(null)

  // Allowance & Approval State
  const [currentAllowanceRaw, setCurrentAllowanceRaw] = useState<string>('0')
  const [routerAddress, setRouterAddress] = useState<`0x${string}`>('0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3')

  // Password / Execution Modal
  const [authModalMode, setAuthModalMode] = useState<'APPROVE' | 'SWAP' | null>(null)
  const [passwordInput, setPasswordInput] = useState<string>('')
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Broadcast & Receipt
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txType, setTxType] = useState<'APPROVE' | 'SWAP' | null>(null)
  const [txStatus, setTxStatus] = useState<'broadcasted' | 'pending' | 'confirmed' | 'failed' | 'dropped'>('broadcasted')
  const [lastExecutedSwap, setLastExecutedSwap] = useState<{
    tokenInSymbol: string
    tokenOutSymbol: string
    amountIn: string
    amountOut: string
  } | null>(null)

  const isMainnet = activeChainId === 1
  const explorerBaseUrl = isMainnet ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'

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
      const [tokenConfigRes, bal, tokenList, prices] = await Promise.all([
        orpc.wallet.getAvailableTokens({ chainId: activeChainId }).catch(() => null),
        fetchWalletBalance(activeAddress, activeChainId).catch(() => '0'),
        fetchUserTokensAndBalances(activeAddress, activeChainId).catch(() => [] as TokenBalanceItem[]),
        fetchMarketPrices().catch(() => null),
      ])

      if (prices) setMarketPrices(prices)
      setNativeBalance(bal)

      const balancesMap: Record<string, string> = {
        [NATIVE_ETH_ADDRESS.toLowerCase()]: bal,
        eth: bal,
      }
      tokenList.forEach((t) => {
        balancesMap[t.token.address.toLowerCase()] = t.formattedBalance
      })

      const baseList = tokenConfigRes?.tokens && tokenConfigRes.tokens.length > 0
        ? tokenConfigRes.tokens
        : (DEFAULT_CHAIN_TOKENS[activeChainId] || DEFAULT_CHAIN_TOKENS[11155111])

      if (tokenConfigRes?.config?.routerAddress) {
        setRouterAddress(tokenConfigRes.config.routerAddress)
      }

      const mergedTokens: DexTokenItem[] = baseList.map((t) => ({
        ...t,
        balance: t.isNative ? bal : (balancesMap[t.address.toLowerCase()] ?? '0.00'),
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
    return availableTokens.find(
      (t) => t.address.toLowerCase() === tokenInAddress.toLowerCase()
    ) || availableTokens[0]
  }, [availableTokens, tokenInAddress])

  const selectedTokenOut = useMemo(() => {
    return availableTokens.find(
      (t) => t.address.toLowerCase() === tokenOutAddress.toLowerCase()
    ) || availableTokens[1] || null
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
        // Dual-layer fallback: query directly from browser RPC to get real on-chain getAmountsOut
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
  }, [amountIn, amountOut, lastEditedField, selectedTokenIn, selectedTokenOut, slippageTolerance, activeChainId])

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

  // Handle Token Selection from Modal
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
    setTokenSearchQuery('')
  }

  // Handle Approval Execution
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

  // Handle Swap Execution
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

  // Filtered Tokens for Modal
  const filteredTokens = useMemo(() => {
    if (!tokenSearchQuery) return availableTokens
    const q = tokenSearchQuery.toLowerCase().trim()
    return availableTokens.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.address.toLowerCase() === q
    )
  }, [availableTokens, tokenSearchQuery])

  // Fiat USD conversions
  const ethRate = marketPrices?.ethereumUsd || 2500
  const usdValueIn = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0) return '0.00'
    const num = Number(amountIn)
    if (selectedTokenIn?.symbol === 'ETH' || selectedTokenIn?.symbol === 'WETH') {
      return (num * ethRate).toFixed(2)
    }
    if (selectedTokenIn?.symbol === 'USDC' || selectedTokenIn?.symbol === 'USDT' || selectedTokenIn?.symbol === 'DAI') {
      return num.toFixed(2)
    }
    return (num * 15).toFixed(2)
  }, [amountIn, selectedTokenIn, ethRate])

  const usdValueOut = useMemo(() => {
    if (!amountOut || Number(amountOut) <= 0) return '0.00'
    const num = Number(amountOut)
    if (selectedTokenOut?.symbol === 'ETH' || selectedTokenOut?.symbol === 'WETH') {
      return (num * ethRate).toFixed(2)
    }
    if (selectedTokenOut?.symbol === 'USDC' || selectedTokenOut?.symbol === 'USDT' || selectedTokenOut?.symbol === 'DAI') {
      return num.toFixed(2)
    }
    return (num * 15).toFixed(2)
  }, [amountOut, selectedTokenOut, ethRate])

  return (
    <VaultGate>
      <div className="max-w-xl mx-auto py-6 space-y-6">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                isMainnet
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isMainnet ? 'Ξ Ethereum Mainnet' : '🧪 Sepolia Testnet'}
            </span>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 rounded-lg bg-dark-card hover:bg-slate-800 text-slate-400 hover:text-white border border-dark-border transition"
              title="Slippage & Routing Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transaction Success / Mining Receipt Card */}
        {txHash && (
          <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-3 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {txStatus === 'confirmed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : txStatus === 'failed' ? (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {txType === 'APPROVE'
                      ? txStatus === 'confirmed'
                        ? `Step 1 Done: ${selectedTokenIn?.symbol} Approved!`
                        : txStatus === 'failed'
                        ? 'Approval Failed On-Chain'
                        : `Authorizing ${selectedTokenIn?.symbol} Approval...`
                      : txStatus === 'confirmed'
                      ? 'Swap Transaction Confirmed!'
                      : txStatus === 'failed'
                      ? 'Swap Failed On-Chain'
                      : 'Swapping On-Chain...'}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {txType === 'APPROVE' && txStatus === 'confirmed' ? (
                      <span className="text-emerald-400 font-sans font-medium">
                        Step 2: You can now click &quot;Swap Tokens&quot; below to execute your trade.
                      </span>
                    ) : (
                      <>
                        Status: <span className="capitalize text-slate-200">{txStatus}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <a
                href={`${explorerBaseUrl}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition"
              >
                <span>Etherscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {txType === 'SWAP' && lastExecutedSwap && (
              <div className="p-3 rounded-xl bg-dark-bg/80 border border-dark-border/80 text-xs flex items-center justify-between font-mono">
                <span className="text-slate-300">
                  {lastExecutedSwap.amountIn} {lastExecutedSwap.tokenInSymbol}
                </span>
                <span className="text-slate-500">➔</span>
                <span className="text-emerald-400 font-semibold">
                  ~{lastExecutedSwap.amountOut} {lastExecutedSwap.tokenOutSymbol}
                </span>
              </div>
            )}

            {txType === 'APPROVE' && txStatus === 'confirmed' && (
              <button
                type="button"
                onClick={() => {
                  setTxHash(null)
                  setTxType(null)
                  checkAllowance()
                  setAuthError(null)
                  setAuthModalMode('SWAP')
                }}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <span>Proceed to Swap Tokens</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {txType === 'SWAP' && txStatus === 'confirmed' && (
              <button
                type="button"
                onClick={() => {
                  setTxHash(null)
                  setTxType(null)
                  setAmountIn('')
                  setAmountOut('')
                  setActiveQuote(null)
                  setLastExecutedSwap(null)
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Make Another Swap
              </button>
            )}
          </div>
        )}

        {/* Main Swap Card */}
        <div className="p-6 rounded-3xl bg-dark-card border border-dark-border shadow-2xl relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">SafeX Swap</h2>
                <p className="text-[11px] text-slate-400">Uniswap V2 AMM • Offline ECDSA Signing</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Slippage:</span>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="px-2 py-0.5 rounded-md bg-dark-bg hover:bg-slate-800 border border-dark-border text-slate-200 font-semibold transition"
              >
                {slippageTolerance}%
              </button>
            </div>
          </div>

          {/* Pay Input Box ("You Pay") */}
          <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border/80 space-y-2 focus-within:border-brand-500/60 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">You Pay</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span>Balance:</span>
                <span className="text-slate-200 font-semibold">
                  {Number(selectedTokenIn?.balance || '0').toFixed(4)} {selectedTokenIn?.symbol}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAmountIn(selectedTokenIn?.balance || '0')
                    setLastEditedField('IN')
                  }}
                  className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition font-bold"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  setAmountIn(val)
                  setLastEditedField('IN')
                }}
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none"
              />

              {/* Token In Selector Button */}
              <button
                type="button"
                onClick={() => {
                  setTokenSelectorTarget('IN')
                  setTokenSearchQuery('')
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white text-xs font-bold font-mono transition shrink-0 shadow-sm"
              >
                {selectedTokenIn?.logoUri && (
                  <img
                    src={selectedTokenIn.logoUri}
                    alt={selectedTokenIn.symbol}
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                )}
                <span>{selectedTokenIn?.symbol || 'Select'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>≈ ${usdValueIn} USD</span>
              {isQuoting && lastEditedField === 'OUT' && (
                <span className="flex items-center gap-1 text-brand-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Calculating...</span>
                </span>
              )}
            </div>
          </div>

          {/* Direction Switch Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleFlipTokens}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-dark-border shadow-lg transition hover:scale-105 active:scale-95"
              title="Reverse Swap Direction"
            >
              <ArrowDownUp className="w-4 h-4 text-brand-400" />
            </button>
          </div>

          {/* Receive Input Box ("You Receive") - Fully Interactive & Editable */}
          <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border/80 space-y-2 focus-within:border-brand-500/60 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">You Receive</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span>Balance:</span>
                <span className="text-slate-200 font-semibold">
                  {Number(selectedTokenOut?.balance || '0').toFixed(4)} {selectedTokenOut?.symbol}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="0.0"
                value={amountOut}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  setAmountOut(val)
                  setLastEditedField('OUT')
                }}
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none"
              />

              {/* Token Out Selector Button */}
              <button
                type="button"
                onClick={() => {
                  setTokenSelectorTarget('OUT')
                  setTokenSearchQuery('')
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white text-xs font-bold font-mono transition shrink-0 shadow-sm"
              >
                {selectedTokenOut?.logoUri && (
                  <img
                    src={selectedTokenOut.logoUri}
                    alt={selectedTokenOut.symbol}
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                )}
                <span>{selectedTokenOut?.symbol || 'Select'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>≈ ${usdValueOut} USD</span>
              {isQuoting && lastEditedField === 'IN' && (
                <span className="flex items-center gap-1 text-brand-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Calculating...</span>
                </span>
              )}
            </div>
          </div>

          {/* Quote Breakdown & Route Indicator */}
          {activeQuote && (
            <div className="p-3.5 rounded-2xl bg-dark-bg/60 border border-dark-border/80 space-y-2 text-xs font-mono animate-in fade-in">
              <div className="flex items-center justify-between text-slate-400">
                <span>Execution Rate:</span>
                <span className="text-slate-200 font-semibold">
                  1 {selectedTokenIn?.symbol} ≈ {activeQuote.executionPrice} {selectedTokenOut?.symbol}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Minimum Received:</span>
                <span className="text-slate-200 font-semibold">
                  {activeQuote.minAmountOutFormatted} {selectedTokenOut?.symbol}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Price Impact:</span>
                <span
                  className={`font-semibold ${
                    activeQuote.priceImpactPercent < 1
                      ? 'text-emerald-400'
                      : activeQuote.priceImpactPercent < 3
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {activeQuote.priceImpactPercent.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-dark-border/40">
                <span>Route Path:</span>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-400">
                  {activeQuote.routePathSymbols.map((sym, idx) => (
                    <React.Fragment key={idx}>
                      <span>{sym}</span>
                      {idx < activeQuote.routePathSymbols.length - 1 && (
                        <span className="text-slate-600">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {activeQuote.priceImpactPercent >= 5 && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-sans mt-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>High Price Impact ({activeQuote.priceImpactPercent.toFixed(1)}%):</strong> Pool reserves on testnet are limited. You will receive fewer tokens than benchmark market rates.
                  </span>
                </div>
              )}
            </div>
          )}

          {quoteError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{quoteError}</span>
            </div>
          )}

          {/* Primary Action Button Gate */}
          <div className="pt-2">
            {!amountIn || Number(amountIn) <= 0 ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 rounded-2xl bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-slate-700/50"
              >
                Enter An Amount
              </button>
            ) : isInsufficientBalance ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 rounded-2xl bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-rose-500/30"
              >
                Insufficient {selectedTokenIn?.symbol} Balance
              </button>
            ) : isAllowanceNeeded ? (
              <button
                type="button"
                onClick={() => setAuthModalMode('APPROVE')}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Approve {selectedTokenIn?.symbol} Spending</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalMode('SWAP')}
                disabled={isQuoting}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {isQuoting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fetching Best Route...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Swap Tokens</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Uniswap-Style Token Selection Modal */}
        {tokenSelectorTarget && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-dark-card border border-dark-border p-5 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-dark-border/60 pb-3">
                <h3 className="text-sm font-bold text-white">Select a Token</h3>
                <button
                  type="button"
                  onClick={() => {
                    setTokenSelectorTarget(null)
                    setTokenSearchQuery('')
                  }}
                  className="text-slate-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search name or paste contract address"
                  value={tokenSearchQuery}
                  onChange={(e) => setTokenSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              {/* Quick Select Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableTokens.slice(0, 5).map((token) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => handleSelectToken(token)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-bg hover:bg-slate-800 border border-dark-border text-xs font-bold text-slate-200 transition"
                  >
                    {token.logoUri && (
                      <img
                        src={token.logoUri}
                        alt={token.symbol}
                        className="w-3.5 h-3.5 rounded-full"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    )}
                    <span>{token.symbol}</span>
                  </button>
                ))}
              </div>

              {/* Token List */}
              <div className="overflow-y-auto divide-y divide-dark-border/40 pr-1 flex-1 space-y-1">
                {filteredTokens.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No tokens found matching &quot;{tokenSearchQuery}&quot;
                  </div>
                ) : (
                  filteredTokens.map((token) => {
                    const isSelected =
                      (tokenSelectorTarget === 'IN' && token.address.toLowerCase() === tokenInAddress.toLowerCase()) ||
                      (tokenSelectorTarget === 'OUT' && token.address.toLowerCase() === tokenOutAddress.toLowerCase())

                    return (
                      <button
                        key={token.address}
                        type="button"
                        onClick={() => handleSelectToken(token)}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-800/80 transition text-left ${
                          isSelected ? 'bg-brand-500/10 border border-brand-500/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {token.logoUri ? (
                            <img
                              src={token.logoUri}
                              alt={token.symbol}
                              className="w-7 h-7 rounded-full bg-slate-800 p-0.5"
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-brand-400">
                              {token.symbol.slice(0, 2)}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{token.symbol}</span>
                              {token.isNative && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                                  Native
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                              {token.name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-semibold text-slate-200 block">
                            {Number(token.balance || '0').toFixed(4)}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-brand-400">
                              <Check className="w-3 h-3" />
                              <span>Selected</span>
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Slippage & Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-dark-card border border-dark-border p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-brand-400" />
                  <span>Swap & Routing Settings</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Slippage Tolerance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Slippage Tolerance</span>
                  <span className="font-mono text-brand-400 font-semibold">{slippageTolerance}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0.1, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSlippageTolerance(val)
                        setCustomSlippage('')
                      }}
                      className={`py-2 rounded-xl text-xs font-mono font-semibold transition border ${
                        slippageTolerance === val && !customSlippage
                          ? 'bg-brand-500/20 text-brand-400 border-brand-500/50'
                          : 'bg-dark-bg text-slate-300 border-dark-border hover:border-slate-600'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '')
                      setCustomSlippage(val)
                      if (val && Number(val) > 0) {
                        setSlippageTolerance(Number(val))
                      }
                    }}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-mono font-semibold transition border focus:outline-none bg-dark-bg text-slate-200 ${
                      customSlippage ? 'border-brand-500 text-brand-400' : 'border-dark-border'
                    }`}
                  />
                </div>
              </div>

              {/* Transaction Deadline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Transaction Deadline</span>
                  <span className="font-mono text-slate-400">{deadlineMinutes} mins</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDeadlineMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-mono font-semibold transition border ${
                        deadlineMinutes === mins
                          ? 'bg-brand-500/20 text-brand-400 border-brand-500/50'
                          : 'bg-dark-bg text-slate-300 border-dark-border hover:border-slate-600'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-md"
              >
                Save & Close
              </button>
            </div>
          </div>
        )}

        {/* Offline Signing Authorization Modal */}
        {authModalMode && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-dark-card border border-dark-border p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-dark-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {authModalMode === 'APPROVE' ? 'Authorize Token Approval' : 'Authorize Swap Transaction'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Private keys reside in RAM only and never leave your device
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode(null)
                    setPasswordInput('')
                    setAuthError(null)
                  }}
                  className="text-slate-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Transaction Summary Card */}
              <div className="p-3.5 rounded-2xl bg-dark-bg border border-dark-border space-y-2 text-xs font-mono">
                {authModalMode === 'APPROVE' ? (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>Action:</span>
                      <span className="text-brand-400 font-semibold">ERC-20 Unlimited Approve</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Token:</span>
                      <span className="text-slate-200">{selectedTokenIn?.name} ({selectedTokenIn?.symbol})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Spender:</span>
                      <span className="text-slate-200">Uniswap V2 Router02</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>You Pay:</span>
                      <span className="text-rose-400 font-semibold">
                        {amountIn} {selectedTokenIn?.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Expected Return:</span>
                      <span className="text-emerald-400 font-semibold">
                        ~{amountOut || activeQuote?.expectedAmountOutFormatted} {selectedTokenOut?.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Minimum Guaranteed:</span>
                      <span className="text-slate-200">
                        {activeQuote?.minAmountOutFormatted} {selectedTokenOut?.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Max Slippage:</span>
                      <span className="text-slate-200">{slippageTolerance}%</span>
                    </div>
                  </>
                )}
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form
                onSubmit={authModalMode === 'APPROVE' ? handleExecuteApproval : handleExecuteSwap}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Vault Master Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Enter your vault password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode(null)
                      setPasswordInput('')
                      setAuthError(null)
                    }}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthorizing || !passwordInput}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    {isAuthorizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in RAM...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Sign & Broadcast</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VaultGate>
  )
}
