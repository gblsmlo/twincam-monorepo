import type { DomainError } from '../errors'
import type { Result } from '../result'
import type { Project, ProjectStatus } from './schemas'

/**
 * What the use cases need from persistence, not the shape of the table
 * (Decision 003). The adapter classifies the expected constraint failures at
 * its own boundary and returns them as `Result`, so no driver message, no
 * constraint name and no row ever reaches a use case.
 */
export type ProjectsRepository = {
  archiveProject(
    input: ArchiveProjectInput,
  ): Promise<Result<Project, DomainError<'conflict' | 'not_found'>>>
  createProject(input: CreateProjectInput): Promise<Result<Project, DomainError<'conflict'>>>
  listProjects(
    filter: ProjectListFilter,
  ): Promise<Result<ProjectListPage, DomainError<'validation'>>>
}

export type ArchiveProjectInput = {
  organizationId: string
  projectId: string
}

export type CreateProjectInput = {
  createdByUserId: string
  description: string | null
  name: string
  organizationId: string
  projectId: string
}

export type ProjectListFilter = {
  cursor?: string
  organizationId: string
  q?: string
  status?: ProjectStatus
}

export type ProjectListPage = {
  items: Project[]
  nextCursor: string | null
}
