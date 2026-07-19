import { auth } from '@twincam/auth/server'
import { logEvent, traceHttpRequest } from '@twincam/observability'
import { Elysia } from 'elysia'
import { createAuthRoutes } from './routes/auth'
import { createHealthResponse } from './routes/health'
import { createUserRoutes } from './routes/users'

const app = new Elysia()
  .get('/health', ({ request }) => traceHttpRequest(request, () => createHealthResponse()))
  .all('/api/auth/*', ({ request }) => traceHttpRequest(request, () => auth.handler(request)))
  .use(createAuthRoutes())
  .use(createUserRoutes())
  .listen(3001)

logEvent({
  level: 'info',
  message: 'api.started',
  context: {
    hostname: app.server?.hostname ?? '0.0.0.0',
    port: app.server?.port ?? 3001,
    service: 'api',
  },
})
