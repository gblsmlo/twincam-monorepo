import { getGlobalStartContext } from '@tanstack/react-start'
import { type CurrentUserResponse, currentUserResponseSchema } from '@twincam/core/contracts/users'

export class CurrentUserUnauthenticatedError extends Error {
  constructor() {
    super('A sessao atual nao esta autenticada')
    this.name = 'CurrentUserUnauthenticatedError'
  }
}

const resolveRequest = (request?: Request): Request | undefined => {
  if (request) {
    return request
  }

  try {
    return (getGlobalStartContext() as { request?: Request } | undefined)?.request
  } catch {
    return undefined
  }
}

const currentUserEndpoint = (request?: Request) =>
  request ? new URL('/api/v1/me', request.url).toString() : '/api/v1/me'

export const fetchCurrentUser = async (request?: Request): Promise<CurrentUserResponse> => {
  const resolvedRequest = resolveRequest(request)
  const headers = resolvedRequest ? new Headers(resolvedRequest.headers) : new Headers()

  headers.set('accept', 'application/json')

  const response = await fetch(currentUserEndpoint(resolvedRequest), {
    credentials: 'include',
    headers,
  })

  if (response.status === 401) {
    throw new CurrentUserUnauthenticatedError()
  }

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar o usuario atual')
  }

  return currentUserResponseSchema.parse(await response.json())
}
