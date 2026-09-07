import { describe, it, expect } from 'vitest'
import { HealthService } from '../services/health.service.js'

describe('HealthService', () => {
  it('should return healthy status structure with Sepolia RPC check', async () => {
    const service = new HealthService()
    const result = await service.getHealth()

    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('rpc')
    expect(result).toHaveProperty('timestamp')
    expect(result).toHaveProperty('environment')
    expect(result).toHaveProperty('uptimeSeconds')
    expect(typeof result.uptimeSeconds).toBe('number')
  })
})
