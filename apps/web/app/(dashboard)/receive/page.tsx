'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useVaultStore } from '@/lib/store/useVaultStore'
import { ReceiveCard } from '@/components/ReceiveCard'
import { VaultGate } from '@/components/VaultGate'

export default function ReceivePage() {
  const { activeAddress, activeBtcAddress } = useVaultStore()

  const evmAddressDisplay = activeAddress || ''
  const btcAddressDisplay = activeBtcAddress || ''

  return (
    <VaultGate>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-2 shadow-xl">
          <h1 className="text-xl font-bold text-white">Receive Crypto Assets</h1>
          <p className="text-xs text-slate-400">
            Share your receiving public address or scan the QR code to deposit funds.
          </p>
        </div>

        <div className="space-y-6">
          <ReceiveCard
            chainName="Ethereum (Sepolia Testnet)"
            symbol="ETH"
            address={evmAddressDisplay}
            derivationPath="m/44'/60'/0'/0/0"
            badgeText="BIP-44 EVM"
            accentColor="emerald"
          />

          {/* Sepolia Faucet Link Card */}
          <div className="p-5 rounded-2xl bg-dark-card border border-dark-border flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white">Need Sepolia Testnet ETH?</h3>
              <p className="text-xs text-slate-400">
                Get free testnet ETH from public Sepolia faucets to test transactions.
              </p>
            </div>

            <a
              href="https://sepoliafaucet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
            >
              <span>Open Sepolia Faucet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <ReceiveCard
            chainName="Bitcoin Native SegWit"
            symbol="BTC"
            address={btcAddressDisplay}
            derivationPath="m/84'/0'/0'/0/0"
            badgeText="BIP-84 SegWit"
            accentColor="amber"
          />
        </div>
      </div>
    </VaultGate>
  )
}
