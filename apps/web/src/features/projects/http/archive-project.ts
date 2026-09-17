import { api } from '@libs/api-client'
import type { Project } from '@twincam/core/projects'

import { toProjectsRequestError } from './errors'

export const archiveProject = async (projectId: string): Promise<Project> => {
  const { data, error } = await api.projects({ projectId }).archive.post()

  if (error) {
    throw toProjectsRequestError(error)
  }

  return data.project
}
