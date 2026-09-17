import { describe, expect, test } from 'bun:test'

import { notFoundError } from '../../../errors'
import { err, isErr, isOk, ok } from '../../../result'
import type { ArchiveProjectInput, ProjectsRepository } from '../../contracts'
import { type Project, projectErrorCodes } from '../../schemas'
import { archiveProject } from '../archive-project'

const archived: Project = {
  createdAt: '2026-09-17T12:00:00.000Z',
  description: null,
  id: 'project-1',
  name: 'Onboarding',
  status: 'archived',
  updatedAt: '2026-09-17T13:00:00.000Z',
}

const repositoryReturning = (
  result: Awaited<ReturnType<ProjectsRepository['archiveProject']>>,
  received: ArchiveProjectInput[] = [],
): ProjectsRepository => ({
  archiveProject: async (input) => {
    received.push(input)
    return result
  },
  createProject: async () => {
    throw new Error('not exercised')
  },
  listProjects: async () => {
    throw new Error('not exercised')
  },
})

describe('archiveProject', () => {
  test('archives for an owner', async () => {
    const result = await archiveProject(
      { actorRole: 'owner', organizationId: 'org-1', projectId: 'project-1' },
      repositoryReturning(ok(archived)),
    )

    expect(isOk(result)).toBe(true)
    expect(isOk(result) && result.value.status).toBe('archived')
  })

  test('archives for an admin', async () => {
    const result = await archiveProject(
      { actorRole: 'admin', organizationId: 'org-1', projectId: 'project-1' },
      repositoryReturning(ok(archived)),
    )

    expect(isOk(result)).toBe(true)
  })

  test('refuses a member before touching persistence', async () => {
    const received: ArchiveProjectInput[] = []

    const result = await archiveProject(
      { actorRole: 'member', organizationId: 'org-1', projectId: 'project-1' },
      repositoryReturning(ok(archived), received),
    )

    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.kind).toBe('forbidden')
    expect(isErr(result) && result.error.code).toBe(projectErrorCodes.archiveForbidden)
    expect(received).toEqual([])
  })

  test('carries the organization from the command, never from the project id', async () => {
    const received: ArchiveProjectInput[] = []

    await archiveProject(
      { actorRole: 'owner', organizationId: 'org-1', projectId: 'project-1' },
      repositoryReturning(ok(archived), received),
    )

    expect(received[0]).toEqual({ organizationId: 'org-1', projectId: 'project-1' })
  })

  test('surfaces the missing project the adapter reported', async () => {
    const result = await archiveProject(
      { actorRole: 'owner', organizationId: 'org-1', projectId: 'missing' },
      repositoryReturning(
        err(notFoundError(projectErrorCodes.notFound, 'Projeto não encontrado.')),
      ),
    )

    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.kind).toBe('not_found')
  })
})
