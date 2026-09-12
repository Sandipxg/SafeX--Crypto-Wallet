'use client'

import React, { useEffect, useState } from 'react'
import { useVaultStore } from '@/core/store/useVaultStore'
import { VaultGate } from '@/components/VaultGate'
import { fetchWalletBalance } from '@/core/crypto'
import { usePrices } from '@/features/prices'
import { TokenAssetsList } from '@/features/tokens'

import { DashboardHeader } from './DashboardHeader'
import { PortfolioCard } from './PortfolioCard'
import { SecurityFooter } from './SecurityFooter'

export function DashboardView() {
  const {
    activeAddress,
    activeBtcAddress,
    activeChainId,
    setActiveChainId,
    checkVaultExists,
  } = useVaultStore()

  const [activeChain, setActiveChain] = useState<string>(
    activeChainId === 1 ? 'ethereum' : 'sepolia'
  )
  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [btcBalance] = useState<string>('0.00000000')
  const { prices: marketPrices, refreshPrices } = usePrices()
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)

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

  // Fetch live ETH balance with chainId & rates
  const fetchLiveBalance = async () => {
    if (!activeAddress) return
    setIsFetchingBalance(true)
    try {
      const [balance] = await Promise.all([
        fetchWalletBalance(activeAddress, activeChainId),
        refreshPrices(),
      ])
      setEthBalance(balance)
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

  const isBitcoin = activeChain === 'bitcoin'
  const isMainnet = activeChainId === 1

  const ethRate = marketPrices?.ethereumUsd || 2500
  const btcRate = marketPrices?.bitcoinUsd || 65000

  const activeRate = isBitcoin ? btcRate : ethRate
  const activeNativeBalanceStr = isBitcoin
    ? btcBalance
    : ethBalance !== null
    ? Number(ethBalance).toFixed(4)
    : '0.0000'
  const activeSymbol = isBitcoin ? 'BTC' : 'ETH'
  const activeAddressDisplay = isBitcoin ? activeBtcAddress : activeAddress

  const activeNumericBalance = isBitcoin
    ? Number(btcBalance)
    : ethBalance
    ? Number(ethBalance)
    : 0

  const formattedUsdValue = (activeNumericBalance * activeRate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <VaultGate>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        {/* Top Header Navigation */}
        <DashboardHeader activeChain={activeChain} onChainChange={handleChainChange} />

        {/* The Single All-in-One Giant Wallet Card */}
        <PortfolioCard
          isBitcoin={isBitcoin}
          isMainnet={isMainnet}
          activeSymbol={activeSymbol}
          activeNativeBalanceStr={activeNativeBalanceStr}
          activeRate={activeRate}
          formattedUsdValue={formattedUsdValue}
          activeAddressDisplay={activeAddressDisplay}
          isFetchingBalance={isFetchingBalance}
          onRefresh={fetchLiveBalance}
        />

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
        <SecurityFooter />
      </div>
    </VaultGate>
  )
}
