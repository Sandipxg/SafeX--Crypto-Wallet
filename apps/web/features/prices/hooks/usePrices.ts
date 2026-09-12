'use client'

import { useState, useEffect, useCallback } from 'react'
import { orpc } from '@/core'
import type { MarketPrices } from '@safex/api'

export function usePrices(pollIntervalMs: number = 60000) {
  const [prices, setPrices] = useState<MarketPrices | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await orpc.prices.getPrices({})
      if (data && typeof data === 'object') {
        setPrices(data as MarketPrices)
        setError(null)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load market rates'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchPrices, pollIntervalMs)
      return () => clearInterval(interval)
    }
  }, [fetchPrices, pollIntervalMs])

  return {
    prices,
    isLoading,
    error,
    refreshPrices: fetchPrices,
    ethPrice: prices?.ethereumUsd ?? 2500,
    btcPrice: prices?.bitcoinUsd ?? 65000,
    linkPrice: prices?.chainlinkUsd ?? 14.5,
  }
}
