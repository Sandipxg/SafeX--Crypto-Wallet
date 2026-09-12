import { os } from '../../../core/orpc/server.js'
import { healthService } from '../services/health.service.js'

export const healthProcedure = os.handler(async () => {
  return await healthService.getHealth()
})

export const healthRouter = {
  check: healthProcedure
}
