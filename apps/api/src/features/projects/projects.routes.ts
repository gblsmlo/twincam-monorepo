import {
  type ProjectsRepository,
  archiveProject as archiveProjectUseCase,
  createProjectRequestSchema,
  createProject as createProjectUseCase,
  projectListQuerySchema,
  projectListResponseSchema,
  projectParamsSchema,
  projectResponseSchema,
} from '@twincam/core/projects'
import { isErr } from '@twincam/core/result'
import { Elysia } from 'elysia'

import { toHttpErrorResponse } from '../../libs/domain-error-status'
import { errorStatuses, mapValidationError } from '../../libs/http-errors'
import { type ActorResolver, createAuthGuard, requireActorContext } from '../auth'
import { createDrizzleProjectsRepository } from './repository'

export type ProjectRouteDependencies = {
  createRepository?: (organizationId: string) => ProjectsRepository
  generateId?: () => string
  resolveActor?: ActorResolver
}

export const createProjectRoutes = ({
  createRepository = createDrizzleProjectsRepository,
  generateId = () => crypto.randomUUID(),
  resolveActor,
}: ProjectRouteDependencies = {}) =>
  new Elysia({ prefix: '/api/projects' })
    .use(createAuthGuard(resolveActor ? { resolveActor } : {}))

    .derive({ as: 'local' }, ({ actorContext }) => {
      const actor = requireActorContext(actorContext)

      return {
        actorRole: actor.role,
        actorUserId: actor.userId,
        repository: createRepository(actor.organizationId),
      }
    })
    .onError(mapValidationError)
    .get(
      '/',
      async ({ query, repository, set }) => {
        const result = await repository.listProjects(query)

        if (isErr(result)) {
          const { body, status } = toHttpErrorResponse(result.error)
          set.status = status
          return body
        }

        return result.value
      },
      {
        detail: { tags: ['Projects'] },
        query: projectListQuerySchema,
        response: { 200: projectListResponseSchema, ...errorStatuses },
      },
    )
    .post(
      '/',
      async ({ actorUserId, body, repository, set }) => {
        const result = await createProjectUseCase(
          { ...body, actorUserId },
          { generateId, repository },
        )

        if (isErr(result)) {
          const { body: errorBody, status } = toHttpErrorResponse(result.error)
          set.status = status
          return errorBody
        }

        set.status = 201
        return { project: result.value }
      },
      {
        body: createProjectRequestSchema,
        detail: { tags: ['Projects'] },
        response: { 201: projectResponseSchema, ...errorStatuses },
      },
    )
    // A state transition is an explicit command, not a generic PATCH: the name
    // of the operation is what the audit trail and the client read.
    .post(
      '/:projectId/archive',
      async ({ actorRole, params, repository, set }) => {
        const result = await archiveProjectUseCase(
          { actorRole, projectId: params.projectId },
          repository,
        )

        if (isErr(result)) {
          const { body, status } = toHttpErrorResponse(result.error)
          set.status = status
          return body
        }

        return { project: result.value }
      },
      {
        detail: { tags: ['Projects'] },
        params: projectParamsSchema,
        response: { 200: projectResponseSchema, ...errorStatuses },
      },
    )
