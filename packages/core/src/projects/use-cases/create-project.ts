import type { DomainError } from '../../errors'
import type { Result } from '../../result'
import type { ProjectsRepository } from '../contracts'
import type { CreateProjectRequest, Project } from '../schemas'

export type CreateProjectCommand = CreateProjectRequest & {
  actorUserId: string
  organizationId: string
}

export type CreateProjectDependencies = {
  generateId: () => string
  repository: ProjectsRepository
}

/**
 * Exists because the identifier is born here, before persistence: the adapter
 * receives a complete row and never invents part of it. The empty description
 * is normalized to `null` in the same place, so "absent" has one representation
 * in the database instead of two.
 *
 * The unique name is not checked by reading first: the port offers a write that
 * reports the conflict, and only the unique index decides it under concurrency.
 */
export const createProject = async (
  command: CreateProjectCommand,
  { generateId, repository }: CreateProjectDependencies,
): Promise<Result<Project, DomainError<'conflict'>>> =>
  repository.createProject({
    createdByUserId: command.actorUserId,
    description: command.description?.trim() || null,
    name: command.name,
    organizationId: command.organizationId,
    projectId: generateId(),
  })
