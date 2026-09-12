'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Eye, Lock, Shield, Trash2 } from 'lucide-react'
import { useVaultStore } from '@/core/store/useVaultStore'
import { RevealSeedModal } from './RevealSeedModal'
import { WipeConfirmModal } from './WipeConfirmModal'

export const SettingsView = () => {
  const router = useRouter()
  const { lock, wipeVault } = useVaultStore()

  const [showRevealModal, setShowRevealModal] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)

  const handleWipeVault = async () => {
    await wipeVault()
    router.push('/onboarding')
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-400" />
          <span>Security & Account Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage your zero-trust local vault, seed phrase backups, and session security.
        </p>
      </div>

      <div className="space-y-4">
        {/* REVEAL SEED PHRASE CARD */}
        <div className="p-6 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-400" />
              <span>Reveal Secret Recovery Phrase</span>
            </h3>
            <p className="text-xs text-slate-400">
              View your 12 or 24-word seed phrase behind password re-verification.
            </p>
          </div>
          <button
            onClick={() => setShowRevealModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 border border-brand-500/30 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Reveal Phrase</span>
          </button>
        </div>

        {/* LOCK VAULT CARD */}
        <div className="p-6 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Lock Active Vault</span>
            </h3>
            <p className="text-xs text-slate-400">
              Immediately zeroizes in-memory decrypted keys from RAM.
            </p>
          </div>
          <button
            onClick={lock}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Now</span>
          </button>
        </div>

        {/* DESTROY VAULT CARD */}
        <div className="p-6 rounded-2xl bg-dark-card border border-red-500/20 flex items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Wipe Local Vault Data</span>
            </h3>
            <p className="text-xs text-slate-400">
              Deletes encrypted vault record from browser IndexedDB. Ensure you have your seed phrase saved.
            </p>
          </div>
          <button
            onClick={() => setShowWipeConfirm(true)}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition shrink-0"
          >
            Wipe Vault
          </button>
        </div>
      </div>

      {/* MODALS */}
      <RevealSeedModal
        isOpen={showRevealModal}
        onClose={() => setShowRevealModal(false)}
      />

      <WipeConfirmModal
        isOpen={showWipeConfirm}
        onClose={() => setShowWipeConfirm(false)}
        onConfirm={handleWipeVault}
      />
    </div>
  )
}
