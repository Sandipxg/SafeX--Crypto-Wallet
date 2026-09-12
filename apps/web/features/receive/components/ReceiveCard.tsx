'use client'

import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Maximize2, X, ShieldCheck } from 'lucide-react'
import { useCopyToClipboard } from '@/core'

export interface ReceiveCardProps {
  chainName: string
  symbol: string
  address: string
  derivationPath: string
  badgeText?: string
  accentColor?: 'emerald' | 'amber' | 'blue' | 'purple'
}

export const ReceiveCard = ({
  chainName,
  symbol,
  address,
  derivationPath,
  badgeText = 'BIP-44 Standard',
  accentColor = 'emerald',
}: ReceiveCardProps) => {
  const { isCopied: copied, copy } = useCopyToClipboard()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCopy = () => {
    copy(address)
  }

  const borderBadgeColor =
    accentColor === 'amber'
      ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'

  return (
    <>
      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md transition-all hover:border-slate-700/80">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${borderBadgeColor}`}>
              {symbol[0]}
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                {chainName} Receive Address
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Path: {derivationPath}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${borderBadgeColor}`}>
            {badgeText}
          </span>
        </div>

        {/* QR Code & Display Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/70 rounded-xl p-4 border border-slate-800/80">
          <div className="relative group p-2.5 bg-white rounded-xl shadow-md shrink-0">
            <QRCodeSVG value={address || 'safex'} size={130} level="M" marginSize={1} />
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity gap-1.5"
            >
              <Maximize2 className="w-4 h-4" /> Expand
            </button>
          </div>

          <div className="flex-1 w-full space-y-3 min-w-0">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Public {symbol} Address
              </label>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/90 font-mono text-xs text-slate-200 break-all select-all leading-relaxed">
                {address || 'Unlock vault to reveal address'}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Address
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 transition-colors border border-slate-700/50"
                title="Expand QR Code"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Non-custodial address generated locally via deterministic BIP-32 HD derivation.</span>
        </div>
      </div>

      {/* Expanded Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-100">{chainName} Address</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">{symbol} • {derivationPath}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <QRCodeSVG value={address} size={220} level="H" marginSize={2} />
            </div>

            <p className="font-mono text-xs text-slate-300 break-all bg-slate-950 p-3 rounded-xl border border-slate-800 select-all">
              {address}
            </p>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors"
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Address String'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
