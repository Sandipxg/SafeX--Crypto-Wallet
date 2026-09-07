import { publicClient } from '../../../core/blockchain/client/publicClient.js'
import { config } from '../../../core/config/env.js'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  rpc: 'connected' | 'disconnected'
  timestamp: string
  environment: string
  uptimeSeconds: number
}

export class HealthService {
  async getHealth(): Promise<HealthCheckResult> {
    let isRpcConnected = false
    try {
      const blockNumber = await publicClient.getBlockNumber()
      isRpcConnected = blockNumber > 0n
    } catch {
      isRpcConnected = false
    }

    return {
      status: isRpcConnected ? 'healthy' : 'degraded',
      rpc: isRpcConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime()),
    }
  }
}

export const healthService = new HealthService()
