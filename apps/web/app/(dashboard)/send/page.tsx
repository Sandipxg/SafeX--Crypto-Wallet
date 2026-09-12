'use client'

import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { VaultGate } from '@/components/VaultGate'
import { SendView } from '@/features/send'

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
        <SendView />
      </Suspense>
    </VaultGate>
  )
}
