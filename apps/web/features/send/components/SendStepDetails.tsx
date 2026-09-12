'use client'

import React from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { TokenBalanceItem } from '@/features/tokens'
import { TokenMetadata } from '@/core/crypto/tokens/tokenTypes'
import { GasEstimateSummary } from '../send.types'
import { UnsignedEip1559Request } from '@/core/crypto'

interface SendStepDetailsProps {
  selectedAssetAddress: string
  onSelectedAssetChange: (addr: string) => void
  recipient: string
  onRecipientChange: (addr: string) => void
  amountInput: string
  onAmountInputChange: (val: string) => void
  onSetMaxAmount: () => void
  nativeBalance: string
  tokens: TokenBalanceItem[]
  selectedToken: TokenMetadata | null
  selectedTokenItem?: TokenBalanceItem | null
  isNative: boolean
  activeSymbol: string
  usdAmount: string | null
  isEstimatingGas: boolean
  gasEstimate: GasEstimateSummary | null
  preparedTxRequest: UnsignedEip1559Request | null
  onSubmit: (e: React.FormEvent) => void
}

export function SendStepDetails({
  selectedAssetAddress,
  onSelectedAssetChange,
  recipient,
  onRecipientChange,
  amountInput,
  onAmountInputChange,
  onSetMaxAmount,
  nativeBalance,
  tokens,
  selectedToken,
  selectedTokenItem,
  isNative,
  activeSymbol,
  usdAmount,
  isEstimatingGas,
  gasEstimate,
  preparedTxRequest,
  onSubmit,
}: SendStepDetailsProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-5 shadow-xl"
    >
      {/* Asset Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Select Asset to Send</label>
        <div className="relative">
          <select
            value={selectedAssetAddress}
            onChange={(e) => onSelectedAssetChange(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer pr-10"
          >
            <option value="ETH">
              Ethereum (ETH) — Balance: {Number(nativeBalance).toFixed(4)} ETH
            </option>
            {tokens.map((item) => (
              <option key={item.token.address} value={item.token.address}>
                {item.token.name} ({item.token.symbol}) — Balance: {item.formattedBalance}{' '}
                {item.token.symbol}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {selectedToken && (
          <p className="text-[11px] font-mono text-slate-500 truncate">
            Contract: {selectedToken.address} ({selectedToken.decimals} decimals)
          </p>
        )}
      </div>

      {/* Recipient Address */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Recipient EVM Address</label>
        <input
          type="text"
          required
          placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
          value={recipient}
          onChange={(e) => onRecipientChange(e.target.value.trim())}
          className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Amount Input with MAX helper */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-300">Amount ({activeSymbol})</label>
          <div className="flex items-center gap-2">
            {usdAmount && (
              <span className="text-[11px] font-medium text-emerald-400 font-mono">
                ≈ ${usdAmount} USD
              </span>
            )}
            <button
              type="button"
              onClick={onSetMaxAmount}
              className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 transition"
            >
              MAX
            </button>
          </div>
        </div>
        <input
          type="number"
          step="any"
          min="0"
          required
          placeholder="0.00"
          value={amountInput}
          onChange={(e) => onAmountInputChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
        />
        <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Available Balance:</span>
          <span className="font-mono text-slate-300">
            {isNative
              ? `${Number(nativeBalance).toFixed(4)} ETH`
              : `${selectedTokenItem?.formattedBalance ?? '0'} ${selectedToken?.symbol}`}
          </span>
        </div>
      </div>

      {/* Gas & Fee Estimation preview */}
      {isEstimatingGas ? (
        <div className="p-4 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>
            {isNative
              ? 'Estimating native EIP-1559 gas fees...'
              : `Simulating ${activeSymbol} ERC-20 transfer & estimating gas...`}
          </span>
        </div>
      ) : gasEstimate ? (
        <div className="p-4 rounded-xl bg-dark-bg border border-dark-border/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Estimated Gas Units:</span>
            <span className="font-mono text-slate-200">
              {gasEstimate.estimatedGasUnits} Gas Units
              {!isNative && ' (ERC-20 Contract Call)'}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Max Fee / Priority Tip:</span>
            <span className="font-mono text-slate-200">
              {(Number(gasEstimate.maxFeePerGas) / 1e9).toFixed(2)} /{' '}
              {(Number(gasEstimate.maxPriorityFeePerGas) / 1e9).toFixed(2)} Gwei
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Estimated Gas Cost:</span>
            <span className="font-mono text-emerald-400">
              {(Number(gasEstimate.estimatedTotalFeeWei) / 1e18).toFixed(6)} ETH
            </span>
          </div>
          <div className="flex justify-between font-semibold text-emerald-400 pt-1 border-t border-dark-border">
            <span>Account Nonce:</span>
            <span className="font-mono">#{preparedTxRequest?.nonce ?? 0}</span>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!gasEstimate || isEstimatingGas}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Review Transaction
      </button>
    </form>
  )
}
