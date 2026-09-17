import { describe, expect, test } from 'bun:test'

import { conflictError } from '../../../errors'
import { type Result, err, isErr, isOk, ok } from '../../../result'
import type { CreateProjectInput, ProjectsRepository } from '../../contracts'
import { type Project, projectErrorCodes } from '../../schemas'
import { createProject } from '../create-project'

const project = (overrides: Partial<Project> = {}): Project => ({
  createdAt: '2026-09-17T12:00:00.000Z',
  description: null,
  id: 'project-1',
  name: 'Onboarding',
  status: 'active',
  updatedAt: '2026-09-17T12:00:00.000Z',
  ...overrides,
})

const repositoryWith = (
  result: Result<Project, ReturnType<typeof conflictError>>,
  received: CreateProjectInput[] = [],
): ProjectsRepository => ({
  archiveProject: async () => {
    throw new Error('not exercised')
  },
  createProject: async (input) => {
    received.push(input)
    return result
  },
  listProjects: async () => {
    throw new Error('not exercised')
  },
})

describe('createProject', () => {
  test('generates the identifier before persistence', async () => {
    const received: CreateProjectInput[] = []
    const repository = repositoryWith(ok(project()), received)

    await createProject(
      { actorUserId: 'user-1', name: 'Onboarding', organizationId: 'org-1' },
      { generateId: () => 'generated-id', repository },
    )

    expect(received[0]?.projectId).toBe('generated-id')
    expect(received[0]?.createdByUserId).toBe('user-1')
  })

  test('normalizes a blank description to a single absent value', async () => {
    const received: CreateProjectInput[] = []
    const repository = repositoryWith(ok(project()), received)

    await createProject(
      { actorUserId: 'user-1', description: '   ', name: 'Onboarding', organizationId: 'org-1' },
      { generateId: () => 'generated-id', repository },
    )

    expect(received[0]?.description).toBeNull()
  })

  test('keeps a described project as written', async () => {
    const received: CreateProjectInput[] = []
    const repository = repositoryWith(ok(project()), received)

    await createProject(
      {
        actorUserId: 'user-1',
        description: 'Primeira entrega',
        name: 'Onboarding',
        organizationId: 'org-1',
      },
      { generateId: () => 'generated-id', repository },
    )

    expect(received[0]?.description).toBe('Primeira entrega')
  })

  test('returns the persisted project on success', async () => {
    const repository = repositoryWith(ok(project({ id: 'project-9' })))

    const result = await createProject(
      { actorUserId: 'user-1', name: 'Onboarding', organizationId: 'org-1' },
      { generateId: () => 'generated-id', repository },
    )

    expect(isOk(result)).toBe(true)
    expect(isOk(result) && result.value.id).toBe('project-9')
  })

  test('surfaces the name conflict the adapter classified', async () => {
    const repository = repositoryWith(
      err(conflictError(projectErrorCodes.nameTaken, 'Já existe um projeto com este nome.')),
    )

    const result = await createProject(
      { actorUserId: 'user-1', name: 'Onboarding', organizationId: 'org-1' },
      { generateId: () => 'generated-id', repository },
    )

    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe(projectErrorCodes.nameTaken)
    expect(isErr(result) && result.error.kind).toBe('conflict')
  })
})
