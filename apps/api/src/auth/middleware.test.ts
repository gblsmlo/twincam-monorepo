import { describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'

import type { ActorResolution } from './actor'
import { createAuthGuard } from './middleware'

const validContext: ActorResolution = {
  ok: true,
  context: {
    organizationId: 'workspace_1',
    organizationName: 'Workspace One',
    organizationSlug: 'workspace-one',
    role: 'owner',
    userId: 'user_1',
  },
}

const unauthenticated: ActorResolution = {
  ok: false,
  status: 401,
  code: 'unauthenticated',
  message: 'Authentication required.',
}

const noActiveWorkspace: ActorResolution = {
  ok: false,
  status: 403,
  code: 'no_active_workspace',
  message: 'An active workspace is required.',
}

const noActiveMembership: ActorResolution = {
  ok: false,
  status: 403,
  code: 'no_active_membership',
  message: 'Active membership is required for this workspace.',
}

const createApp = (resolveActor: () => Promise<ActorResolution>) =>
  new Elysia().use(createAuthGuard({ resolveActor })).get('/whoami', ({ actorContext }) => ({
    organizationId: actorContext?.organizationId ?? null,
    role: actorContext?.role ?? null,
    userId: actorContext?.userId ?? null,
  }))

const request = (resolveActor: () => Promise<ActorResolution>) =>
  createApp(resolveActor).handle(new Request('http://localhost/whoami'))

describe('auth guard middleware', () => {
  test('injects actor context and runs handler for a valid session', async () => {
    const response = await request(async () => validContext)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({
      organizationId: 'workspace_1',
      role: 'owner',
      userId: 'user_1',
    })
  })

  test('rejects missing session with 401', async () => {
    const response = await request(async () => unauthenticated)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body).toEqual({
      error: { code: 'unauthenticated', message: 'Authentication required.' },
    })
  })

  test('rejects inactive membership with 403', async () => {
    const response = await request(async () => noActiveMembership)

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body).toEqual({
      error: {
        code: 'no_active_membership',
        message: 'Active membership is required for this workspace.',
      },
    })
  })

  test('rejects organization without active workspace with 403', async () => {
    const response = await request(async () => noActiveWorkspace)

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body).toEqual({
      error: {
        code: 'no_active_workspace',
        message: 'An active workspace is required.',
      },
    })
  })

  test('short-circuits before the handler runs on rejection', async () => {
    const seen: string[] = []
    const app = new Elysia()
      .use(createAuthGuard({ resolveActor: async () => unauthenticated }))
      .get('/probe', () => {
        seen.push('handler')
        return { ok: true }
      })

    const response = await app.handle(new Request('http://localhost/probe'))

    expect(response.status).toBe(401)
    expect(seen).toEqual([])
  })
})
