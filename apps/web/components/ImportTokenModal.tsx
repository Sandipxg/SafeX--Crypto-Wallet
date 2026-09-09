'use client'

import React, { useState } from 'react'
import { isAddress, getAddress } from 'viem'
import { X, Plus, Loader2, AlertCircle, CheckCircle2, Coins } from 'lucide-react'
import { importCustomToken } from '@/lib/services/tokenService'
import { TokenMetadata } from '@/lib/crypto/tokens/tokenTypes'

interface ImportTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onTokenImported: () => void
  walletAddress: string
  chainId: number
}

export function ImportTokenModal({
  isOpen,
  onClose,
  onTokenImported,
  walletAddress,
  chainId,
}: ImportTokenModalProps) {
  const [addressInput, setAddressInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewToken, setPreviewToken] = useState<TokenMetadata | null>(null)

  if (!isOpen) return null

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim()
    setAddressInput(val)
    setErrorMsg(null)
    setPreviewToken(null)
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddress(addressInput)) {
      setErrorMsg('Please enter a valid 42-character EVM contract address (0x...).')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const imported = await importCustomToken(addressInput, chainId, walletAddress)
      setPreviewToken(imported)
      onTokenImported()
      setTimeout(() => {
        setAddressInput('')
        setPreviewToken(null)
        onClose()
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to inspect or import token contract.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Custom Token</h3>
              <p className="text-[11px] text-slate-400">Add any ERC-20 token by contract address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {previewToken && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Successfully imported {previewToken.name} ({previewToken.symbol}) with {previewToken.decimals} decimals!</span>
          </div>
        )}

        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Token Contract Address</label>
            <input
              type="text"
              required
              placeholder="0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
              value={addressInput}
              onChange={handleAddressChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
            />
            <p className="text-[10px] text-slate-500">
              SafeX will automatically inspect the contract and fetch its symbol, name, and decimals.
            </p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-dark-bg hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-dark-border transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !addressInput}
              className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting Contract...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
