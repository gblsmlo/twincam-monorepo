import type { ProjectsRepository } from '@twincam/core/projects'

import { archiveProject, createProject, listProjects } from './projects-persistence'

export const createDrizzleProjectsRepository = (): ProjectsRepository => ({
  archiveProject,
  createProject,
  listProjects,
})
