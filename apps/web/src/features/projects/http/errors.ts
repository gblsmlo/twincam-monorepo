import { edenStatus } from '@libs/api-client'
import { errorEnvelopeSchema } from '@twincam/core/contracts/http'

export class ProjectsRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ProjectsRequestError'
  }
}

/**
 * Translates the transport failure into the feature's vocabulary. The `code`
 * comes from the server envelope and is what the hooks route on; a body that
 * does not parse means the failure never reached the API, and the copy says so
 * instead of showing a blank message.
 */
export const toProjectsRequestError = (error: {
  status: unknown
  value: unknown
}): ProjectsRequestError => {
  const envelope = errorEnvelopeSchema.safeParse(error.value)
  const status = edenStatus(error)

  if (!envelope.success) {
    return new ProjectsRequestError(
      'Não foi possível falar com o servidor. Tente novamente.',
      'unknown_error',
      status,
    )
  }

  return new ProjectsRequestError(envelope.data.error.message, envelope.data.error.code, status)
}
