'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

export interface WipeConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export const WipeConfirmModal = ({ isOpen, onClose, onConfirm }: WipeConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded-2xl bg-dark-card border border-red-500/30 space-y-6 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="p-3 rounded-full bg-red-500/10 text-red-400 w-fit mx-auto border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Wipe Local Vault Storage?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            This will delete your encrypted vault from IndexedDB. If you do not have your 12-word seed phrase backed up, your funds will be lost forever.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-slate-300 text-xs font-semibold hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
          >
            Yes, Delete Vault
          </button>
        </div>
      </div>
    </div>
  )
}
