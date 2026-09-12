'use client'

import { VaultGate } from '@/components/VaultGate'
import { ReceiveView } from '@/features/receive'

export default function ReceivePage() {
  return (
    <VaultGate>
      <ReceiveView />
    </VaultGate>
  )
}
