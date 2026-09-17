import { api } from '@libs/api-client'
import type { ProjectListQuery, ProjectListResponse } from '@twincam/core/projects'

import { toProjectsRequestError } from './errors'

/**
 * The route declares `200` with this same schema and validated it there, so the
 * client does not parse the body again: a second parse is a second source.
 */
export const listProjects = async (query: ProjectListQuery): Promise<ProjectListResponse> => {
  const { data, error } = await api.projects.get({ query })

  if (error) {
    throw toProjectsRequestError(error)
  }

  return data
}
