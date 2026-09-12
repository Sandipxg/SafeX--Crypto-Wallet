import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export interface BackToDashboardProps {
  className?: string
}

export const BackToDashboard = ({ className = '' }: BackToDashboardProps) => {
  return (
    <Link
      href="/dashboard"
      className={`inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>Back to Dashboard</span>
    </Link>
  )
}
