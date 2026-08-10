const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface HealthStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  db: 'connected' | 'disconnected'
  timestamp: string
  environment: string
  uptimeSeconds: number
}

export async function fetchHealthStatus(): Promise<HealthStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' })
    if (!res.ok && res.status !== 503) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const data = await res.json()
    return data
  } catch (error) {
    console.error('[Health API Error]', error)
    return {
      status: 'unhealthy',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
      environment: 'unknown',
      uptimeSeconds: 0
    }
  }
}
