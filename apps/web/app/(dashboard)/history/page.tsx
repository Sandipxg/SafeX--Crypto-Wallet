'use client'

import { VaultGate } from '@/components/VaultGate'
import { HistoryView } from '@/features/history'

export default function HistoryPage() {
  return (
    <VaultGate>
      <HistoryView />
    </VaultGate>
  )
}
