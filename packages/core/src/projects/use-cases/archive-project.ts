import type { DomainError } from '../../errors'
import { forbiddenError } from '../../errors'
import { type Result, err } from '../../result'
import type { ProjectsRepository } from '../contracts'
import { type Project, projectErrorCodes } from '../schemas'

/**
 * Who may archive is a rule of this capability, not of the session: the guard
 * refuses the anonymous request, and this decides what an authenticated actor
 * may do with the resource.
 */
const archiveRoles: readonly string[] = ['admin', 'owner']

/**
 * Consulted by the use case and by the screen that decides whether to offer the
 * action. One owner: the client hides a button it would not be allowed to use,
 * and the rule still runs on the server for whoever skips the screen.
 */
export const canArchiveProject = (actorRole: string): boolean => archiveRoles.includes(actorRole)

export type ArchiveProjectCommand = {
  actorRole: string
  projectId: string
}

export const archiveProject = async (
  command: ArchiveProjectCommand,
  repository: ProjectsRepository,
): Promise<Result<Project, DomainError<'conflict' | 'forbidden' | 'not_found'>>> => {
  if (!canArchiveProject(command.actorRole)) {
    return err(
      forbiddenError(
        projectErrorCodes.archiveForbidden,
        'Apenas owner ou admin pode arquivar um projeto.',
      ),
    )
  }

  return repository.archiveProject({ projectId: command.projectId })
}
