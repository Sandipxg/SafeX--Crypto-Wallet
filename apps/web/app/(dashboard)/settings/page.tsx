'use client'

import { VaultGate } from '@/components/VaultGate'
import { SettingsView } from '@/features/settings'

export default function SettingsPage() {
  return (
    <VaultGate>
      <SettingsView />
    </VaultGate>
  )
}
