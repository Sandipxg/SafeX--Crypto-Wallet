'use client'

import React, { useState } from 'react'
import { Settings2 } from 'lucide-react'

interface SlippageModalProps {
  isOpen: boolean
  onClose: () => void
  slippageTolerance: number
  onSlippageChange: (val: number) => void
  deadlineMinutes: number
  onDeadlineChange: (val: number) => void
}

export function SlippageModal({
  isOpen,
  onClose,
  slippageTolerance,
  onSlippageChange,
  deadlineMinutes,
  onDeadlineChange,
}: SlippageModalProps) {
  const [customSlippage, setCustomSlippage] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-dark-card border border-dark-border p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-brand-400" />
            <span>Swap & Routing Settings</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Slippage Tolerance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Slippage Tolerance</span>
            <span className="font-mono text-brand-400 font-semibold">{slippageTolerance}%</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0.1, 0.5, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  onSlippageChange(val)
                  setCustomSlippage('')
                }}
                className={`py-2 rounded-xl text-xs font-mono font-semibold transition border ${
                  slippageTolerance === val && !customSlippage
                    ? 'bg-brand-500/20 text-brand-400 border-brand-500/50'
                    : 'bg-dark-bg text-slate-300 border-dark-border hover:border-slate-600'
                }`}
              >
                {val}%
              </button>
            ))}
            <input
              type="text"
              placeholder="Custom"
              value={customSlippage}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '')
                setCustomSlippage(val)
                if (val && Number(val) > 0) {
                  onSlippageChange(Number(val))
                }
              }}
              className={`py-2 px-2 text-center rounded-xl text-xs font-mono font-semibold transition border focus:outline-none bg-dark-bg text-slate-200 ${
                customSlippage ? 'border-brand-500 text-brand-400' : 'border-dark-border'
              }`}
            />
          </div>
        </div>

        {/* Transaction Deadline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Transaction Deadline</span>
            <span className="font-mono text-slate-400">{deadlineMinutes} mins</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 20, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onDeadlineChange(mins)}
                className={`py-2 rounded-xl text-xs font-mono font-semibold transition border ${
                  deadlineMinutes === mins
                    ? 'bg-brand-500/20 text-brand-400 border-brand-500/50'
                    : 'bg-dark-bg text-slate-300 border-dark-border hover:border-slate-600'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-md"
        >
          Save & Close
        </button>
      </div>
    </div>
  )
}
