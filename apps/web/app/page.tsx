'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { useVaultStore } from '@/core/store/useVaultStore'
import { UnlockVaultView, OnboardingSelectionView } from '@/features/onboarding'

export default function HomePage() {
  const router = useRouter()
  const {
    vaultState,
    hasVaultInStorage,
    checkVaultExists,
  } = useVaultStore()

  const [isCheckingVault, setIsCheckingVault] = useState(true)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const exists = await checkVaultExists()
        if (isMounted) {
          setIsCheckingVault(false)
          if (exists && vaultState === 'UNLOCKED') {
            router.replace('/dashboard')
          }
        }
      } catch {
        if (isMounted) {
          setIsCheckingVault(false)
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [checkVaultExists, vaultState, router])

  // 1. Initial Loading State while checking IndexedDB
  if (isCheckingVault) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 animate-pulse">
          <Shield className="w-10 h-10" />
        </div>
        <p className="text-sm font-mono text-slate-400">Initializing SafeX Vault...</p>
      </div>
    )
  }

  // 2. Existing User (Encrypted Vault Exists in Storage) -> Unlock Prompt
  if (hasVaultInStorage) {
    return <UnlockVaultView />
  }

  // 3. New User (No Vault in Storage) -> Create or Import Options
  return <OnboardingSelectionView />
}
