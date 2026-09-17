import type { ProjectsRepository } from '@twincam/core/projects'
import { withWorkspaceTransaction } from '@twincam/infra-database/workspace'

import { type ProjectsOperations, createProjectsOperations } from './projects-persistence'

/**
 * Composition root of the slice's persistence, and the single owner of the
 * transaction boundary (Decision 019). The operations know how to read and
 * write; this decides where a transaction begins and ends, and binds the
 * workspace once for every one of them.
 *
 * A composition that must be atomic — a write plus its outbox row — adds one
 * entry here that runs several operations inside a single `inWorkspace`, and
 * no operation changes.
 */
export const createDrizzleProjectsRepository = (organizationId: string): ProjectsRepository => {
  const inWorkspace = <T>(use: (operations: ProjectsOperations) => Promise<T>): Promise<T> =>
    withWorkspaceTransaction(organizationId, (tx) =>
      use(createProjectsOperations(tx, organizationId)),
    )

  return {
    archiveProject: (input) => inWorkspace((operations) => operations.archiveProject(input)),
    createProject: (input) => inWorkspace((operations) => operations.createProject(input)),
    listProjects: (filter) => inWorkspace((operations) => operations.listProjects(filter)),
  }
}
