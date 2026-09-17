import { api, edenCreated } from '@libs/api-client'
import {
  type CreateProjectRequest,
  type Project,
  projectResponseSchema,
} from '@twincam/core/projects'

import { ProjectsRequestError, toProjectsRequestError } from './errors'

/**
 * `201` does not reach Eden's `200` slot, so `data` arrives as `unknown` and the
 * contract schema is what restores the type here.
 */
export const createProject = async (payload: CreateProjectRequest): Promise<Project> => {
  const result = await api.projects.post(payload)
  const { data, error } = edenCreated<unknown>(result)

  if (error) {
    throw toProjectsRequestError(error)
  }

  const parsed = projectResponseSchema.safeParse(data)

  if (!parsed.success) {
    // The project may exist even when the body is unreadable, so the copy sends
    // the person back to the list instead of asking for a second attempt.
    throw new ProjectsRequestError(
      'O projeto foi criado, mas a resposta do servidor não pôde ser lida. Atualize a lista.',
      'invalid_success_response',
      result.status,
    )
  }

  return parsed.data.project
}
