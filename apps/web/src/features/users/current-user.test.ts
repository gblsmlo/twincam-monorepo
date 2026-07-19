import { afterEach, describe, expect, mock, test } from 'bun:test'

const startRequest = new Request('http://localhost/dashboard', {
  headers: {
    cookie: 'session=abc123',
  },
})

mock.module('@tanstack/react-start', () => ({
  getGlobalStartContext: () => ({
    request: startRequest,
  }),
}))

const { CurrentUserUnauthenticatedError, fetchCurrentUser } = await import('./current-user')

describe('fetchCurrentUser', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const createFetchStub = (
    handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  ): typeof fetch => Object.assign(handler, { preconnect: () => undefined }) as typeof fetch

  test('forwards the current request cookies during the startup bootstrap', async () => {
    let capturedInit: RequestInit | undefined

    globalThis.fetch = createFetchStub(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedInit = init

      return new Response(
        JSON.stringify({
          organization: {
            id: 'org_1',
            name: 'Acme',
            slug: 'acme',
          },
          role: 'owner',
          user: {
            email: 'ana@example.com',
            id: 'user_1',
            image: null,
            name: 'Ana',
          },
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        },
      )
    })

    const session = await fetchCurrentUser()

    expect(session.user.email).toBe('ana@example.com')
    expect(session.role).toBe('owner')
    expect(session.organization?.slug).toBe('acme')
    expect(capturedInit?.credentials).toBe('include')
    expect(capturedInit?.headers instanceof Headers).toBe(true)
    expect((capturedInit?.headers as Headers).get('cookie')).toBe('session=abc123')
    expect((capturedInit?.headers as Headers).get('accept')).toBe('application/json')
  })

  test('uses the current request origin for the server-side session bootstrap', async () => {
    let capturedInput: RequestInfo | URL | undefined

    globalThis.fetch = createFetchStub(async (input: RequestInfo | URL) => {
      capturedInput = input

      return new Response(
        JSON.stringify({
          organization: null,
          role: null,
          user: {
            email: 'ana@example.com',
            id: 'user_1',
            image: null,
            name: 'Ana',
          },
        }),
        { status: 200 },
      )
    })

    await fetchCurrentUser()

    expect(capturedInput).toBe('http://localhost/api/v1/me')
  })

  test('identifies an absent session from a 401 response', async () => {
    globalThis.fetch = createFetchStub(async () => new Response(null, { status: 401 }))

    await expect(fetchCurrentUser()).rejects.toBeInstanceOf(CurrentUserUnauthenticatedError)
  })

  test('preserves operational failures instead of treating them as an absent session', async () => {
    globalThis.fetch = createFetchStub(async () => new Response(null, { status: 503 }))

    await expect(fetchCurrentUser()).rejects.toThrow('Nao foi possivel carregar o usuario atual')
    await expect(fetchCurrentUser()).rejects.not.toBeInstanceOf(CurrentUserUnauthenticatedError)
  })
})
