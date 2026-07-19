import {
  type SignUpRequest,
  type SignUpResponse,
  signUpErrorResponseSchema,
  signUpResponseSchema,
} from '@twincam/core/contracts/auth'

import { AuthRequestError } from './errors'

export async function signUp(payload: SignUpRequest): Promise<SignUpResponse> {
  const response = await fetch('/api/v1/auth/sign-up', {
    body: JSON.stringify(payload),
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    method: 'POST',
  })

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    const errorResponse = signUpErrorResponseSchema.safeParse(json)
    const message = errorResponse.success
      ? errorResponse.data.error.message
      : 'Nao foi possivel criar a conta.'
    const code = errorResponse.success ? errorResponse.data.error.code : 'unknown_error'
    throw new AuthRequestError(message, code, response.status)
  }

  const parsed = signUpResponseSchema.safeParse(json)

  if (!parsed.success) {
    throw new AuthRequestError(
      'A conta foi criada, mas nao foi possivel confirmar a resposta do servidor. Tente entrar com seu e-mail.',
      'invalid_success_response',
      response.status,
    )
  }

  return parsed.data
}
