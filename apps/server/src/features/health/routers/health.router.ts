import { os } from '@orpc/server'
import { healthService } from '../services/health.service.js'

export const healthProcedure = os.handler(async () => {
  return await healthService.getHealth()
})

export const healthRouter = {
  check: healthProcedure
}
