import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { config } from './core/config/env.js'
import { healthService } from './features/health/services/health.service.js'
import { createFetchHandler } from '@orpc/server/fetch'
import { appRouter } from './router.js'
import type { ORPCContext } from './core/orpc/server.js'

const app = express()

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}))
app.use(express.json())

const orpcHandler = createFetchHandler({ router: appRouter })

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'SafeX Crypto Exchange API',
    status: 'running',
    healthcheck: `http://localhost:${config.port}/health`
  })
})

// Silence internal Chrome DevTools probe requests
app.get('/.well-known/*', (_req: Request, res: Response) => {
  res.status(204).end()
})

// Raw HTTP GET /health for standard monitoring
app.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await healthService.getHealth()
    const statusCode = result.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(result)
  } catch (error) {
    next(error)
  }
})

// oRPC Handler middleware for all procedures (e.g. orpc.health.check())
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    const hasBody = !['GET', 'HEAD'].includes(req.method)
    
    const headers = new Headers()
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value)
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '))
      }
    })

    const request = new Request(url, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined
    })

    const context: ORPCContext = {
      clientIp: req.ip,
      timestamp: Date.now(),
    }

    const response = await orpcHandler({ request, context })
    if (response && response.status !== 404) {
      res.status(response.status)
      response.headers.forEach((val, key) => res.setHeader(key, val))
      const text = await response.text()
      if (response.status >= 400) {
        console.warn(`[SafeX Server] oRPC error on ${req.originalUrl} (${response.status}):`, text)
      }
      return res.send(text)
    }
  } catch (error) {
    console.error('[SafeX Server] oRPC middleware error:', error)
  }
  next()
})

// Start server
app.listen(config.port, () => {
  console.log(`[SafeX Server] Running on http://localhost:${config.port}`)
  console.log(`[SafeX Server] Healthcheck available at http://localhost:${config.port}/health`)
})
