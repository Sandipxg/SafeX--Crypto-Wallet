'use client'

import { useEffect, useState } from 'react'
import { fetchHealthStatus } from '../services/healthService'
import { Server, Database, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

export function StatusCard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHealthStatus>> | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadStatus() {
    setLoading(true)
    const result = await fetchHealthStatus()
    setData(result)
    setLoading(false)
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Status</h1>
          <p className="text-sm text-slate-400">Live healthcheck of SafeX API & PostgreSQL Database</p>
        </div>
        <button
          onClick={loadStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-slate-300 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Status */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Server className="w-5 h-5 text-brand-500" />
              <span className="font-semibold">Backend API</span>
            </div>
            {data?.status === 'healthy' ? (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Unhealthy
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Node.js Express + oRPC procedure handler</p>
        </div>

        {/* Database Status */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="w-5 h-5 text-brand-500" />
              <span className="font-semibold">PostgreSQL Database</span>
            </div>
            {data?.db === 'connected' ? (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Disconnected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">PostgreSQL 16 container via connection pool</p>
        </div>
      </div>

      {/* Metadata Card */}
      {data && (
        <div className="p-4 rounded-xl bg-dark-card/40 border border-dark-border/50 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Last checked: {new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>
          <div>Environment: <span className="text-slate-200 font-mono">{data.environment}</span></div>
          <div>Uptime: <span className="text-slate-200 font-mono">{data.uptimeSeconds}s</span></div>
        </div>
      )}
    </div>
  )
}
