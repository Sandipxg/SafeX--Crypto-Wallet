import { checkDbConnection } from '../../../core/db/client.js'
import { config } from '../../../core/config/env.js'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  db: 'connected' | 'disconnected'
  timestamp: string
  environment: string
  uptimeSeconds: number
}

export class HealthService {
  async getHealth(): Promise<HealthCheckResult> {
    const isDbConnected = await checkDbConnection()

    return {
      status: isDbConnected ? 'healthy' : 'degraded',
      db: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime())
    }
  }
}

export const healthService = new HealthService()
