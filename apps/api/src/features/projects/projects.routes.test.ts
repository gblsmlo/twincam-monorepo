import { describe, expect, test } from 'bun:test'
import { conflictError, notFoundError, validationError } from '@twincam/core/errors'
import { type Project, type ProjectsRepository, projectErrorCodes } from '@twincam/core/projects'
import { err, ok } from '@twincam/core/result'
import { Elysia } from 'elysia'

import type { ActorResolution, ActorResolver } from '../auth'
import { createProjectRoutes } from './projects.routes'

const project = (overrides: Partial<Project> = {}): Project => ({
  createdAt: '2026-09-17T12:00:00.000Z',
  description: null,
  id: 'project-1',
  name: 'Onboarding',
  status: 'active',
  updatedAt: '2026-09-17T12:00:00.000Z',
  ...overrides,
})

const actorAs = (role: string): ActorResolver => {
  const resolution: ActorResolution = {
    ok: true,
    context: {
      organizationId: 'workspace_1',
      organizationName: 'Workspace One',
      organizationSlug: 'workspace-one',
      role,
      userId: 'user_1',
    },
  }

  return async () => resolution
}

const anonymous: ActorResolver = async () => ({
  ok: false,
  status: 401,
  code: 'unauthenticated',
  message: 'Authentication required.',
})

const repositoryStub = (overrides: Partial<ProjectsRepository> = {}): ProjectsRepository => ({
  archiveProject: async () => ok(project({ status: 'archived' })),
  createProject: async () => ok(project()),
  listProjects: async () => ok({ items: [project()], nextCursor: null }),
  ...overrides,
})

const createRoutes = (
  resolveActor: ActorResolver = actorAs('owner'),
  repository: ProjectsRepository = repositoryStub(),
) =>
  createProjectRoutes({
    createRepository: () => repository,
    generateId: () => 'generated-id',
    resolveActor,
  })

const get = (path: string, resolveActor?: ActorResolver, repository?: ProjectsRepository) =>
  createRoutes(resolveActor, repository).handle(new Request(`http://localhost${path}`))

const post = (
  path: string,
  body: unknown,
  resolveActor?: ActorResolver,
  repository?: ProjectsRepository,
) =>
  createRoutes(resolveActor, repository).handle(
    new Request(`http://localhost${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    }),
  )

describe('projects listing', () => {
  test('answers the workspace page for an authenticated actor', async () => {
    const response = await get('/api/projects')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [project()], nextCursor: null })
  })

  test('binds the repository to the actor workspace, never to the query', async () => {
    const bound: string[] = []

    const routes = createProjectRoutes({
      createRepository: (organizationId) => {
        bound.push(organizationId)
        return repositoryStub()
      },
      generateId: () => 'generated-id',
      resolveActor: actorAs('member'),
    })

    await routes.handle(new Request('http://localhost/api/projects?organizationId=workspace_2'))

    // The tenant is bound once, where the session is read. No handler and no
    // port input can carry another one (Decision 019).
    expect(bound).toEqual(['workspace_1'])
  })

  test('refuses an anonymous request before reaching the repository', async () => {
    const seen: string[] = []
    const repository = repositoryStub({
      listProjects: async () => {
        seen.push('repository')
        return ok({ items: [], nextCursor: null })
      },
    })

    const response = await get('/api/projects', anonymous, repository)

    expect(response.status).toBe(401)
    expect(seen).toEqual([])
  })

  test('maps an unreadable cursor to 400 with its own code', async () => {
    const repository = repositoryStub({
      listProjects: async () =>
        err(validationError(projectErrorCodes.invalidCursor, 'O cursor da listagem é inválido.')),
    })

    const response = await get('/api/projects?cursor=broken', actorAs('owner'), repository)

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: { code: projectErrorCodes.invalidCursor },
    })
  })

  test('rejects a status outside the catalogue at the boundary', async () => {
    const response = await get('/api/projects?status=deleted')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'invalid_request', message: 'Revise os dados enviados e tente novamente.' },
    })
  })
})

describe('project creation', () => {
  test('creates with 201 and returns the resource', async () => {
    const response = await post('/api/projects', { name: 'Onboarding' })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ project: project() })
  })

  test('passes the generated id and the actor to the use case', async () => {
    const seen: Array<{ createdByUserId: string; projectId: string }> = []
    const repository = repositoryStub({
      createProject: async (input) => {
        seen.push({ createdByUserId: input.createdByUserId, projectId: input.projectId })
        return ok(project())
      },
    })

    await post('/api/projects', { name: 'Onboarding' }, actorAs('member'), repository)

    expect(seen).toEqual([{ createdByUserId: 'user_1', projectId: 'generated-id' }])
  })

  test('refuses a name shorter than the contract, before the use case', async () => {
    const seen: string[] = []
    const repository = repositoryStub({
      createProject: async () => {
        seen.push('repository')
        return ok(project())
      },
    })

    const response = await post('/api/projects', { name: 'ab' }, actorAs('owner'), repository)

    expect(response.status).toBe(400)
    expect(seen).toEqual([])
  })

  test('translates the name conflict into 409 with a stable code', async () => {
    const repository = repositoryStub({
      createProject: async () =>
        err(conflictError(projectErrorCodes.nameTaken, 'Já existe um projeto com este nome.')),
    })

    const response = await post(
      '/api/projects',
      { name: 'Onboarding' },
      actorAs('owner'),
      repository,
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ error: { code: projectErrorCodes.nameTaken } })
  })
})

describe('project archiving', () => {
  test('archives for an owner and returns the updated resource', async () => {
    const response = await post('/api/projects/project-1/archive', undefined)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ project: project({ status: 'archived' }) })
  })

  test('refuses a member with 403 without touching the repository', async () => {
    const seen: string[] = []
    const repository = repositoryStub({
      archiveProject: async () => {
        seen.push('repository')
        return ok(project({ status: 'archived' }))
      },
    })

    const response = await post(
      '/api/projects/project-1/archive',
      undefined,
      actorAs('member'),
      repository,
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      error: { code: projectErrorCodes.archiveForbidden },
    })
    expect(seen).toEqual([])
  })

  test('answers 404 for a project the workspace does not hold', async () => {
    const repository = repositoryStub({
      archiveProject: async () =>
        err(notFoundError(projectErrorCodes.notFound, 'Projeto não encontrado.')),
    })

    const response = await post(
      '/api/projects/missing/archive',
      undefined,
      actorAs('owner'),
      repository,
    )

    expect(response.status).toBe(404)
  })

  test('answers 409 when the project is already archived', async () => {
    const repository = repositoryStub({
      archiveProject: async () =>
        err(conflictError(projectErrorCodes.alreadyArchived, 'Este projeto já está arquivado.')),
    })

    const response = await post(
      '/api/projects/project-1/archive',
      undefined,
      actorAs('owner'),
      repository,
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      error: { code: projectErrorCodes.alreadyArchived },
    })
  })
})

describe('module scope', () => {
  test('neither the guard nor the module derive reaches a module mounted after it', async () => {
    const probe = new Elysia({ prefix: '/probe' }).get('/context', (context) => ({
      hasActorContext: 'actorContext' in context,
      hasOrganizationId: 'organizationId' in context,
    }))

    const app = new Elysia().use(createRoutes()).use(probe)

    const response = await app.handle(new Request('http://localhost/probe/context'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ hasActorContext: false, hasOrganizationId: false })
  })
})
