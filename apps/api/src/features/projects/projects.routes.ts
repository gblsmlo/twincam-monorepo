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
  generateId?: () => string
  repository?: ProjectsRepository
  resolveActor?: ActorResolver
}

export const createProjectRoutes = ({
  generateId = () => crypto.randomUUID(),
  repository = createDrizzleProjectsRepository(),
  resolveActor,
}: ProjectRouteDependencies = {}) =>
  new Elysia({ prefix: '/api/projects' })
    .use(createAuthGuard(resolveActor ? { resolveActor } : {}))
    // `local`, not `scoped`: with `scoped` this reaches modules registered after
    // this one in `createApp()`, and a route with no guard would run it and fail
    // with a 500 instead of its own contract (Decision 005).
    .derive({ as: 'local' }, ({ actorContext }) => {
      const actor = requireActorContext(actorContext)

      return {
        actorRole: actor.role,
        actorUserId: actor.userId,
        organizationId: actor.organizationId,
      }
    })
    .onError(mapValidationError)
    .get(
      '/',
      async ({ organizationId, query, set }) => {
        // No use-case trigger applies to a filtered read: it loads no second
        // entity, evaluates no policy and generates no id. The route calls the
        // port, and no module exists only to forward a method.
        const result = await repository.listProjects({
          cursor: query.cursor,
          organizationId,
          q: query.q,
          status: query.status,
        })

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
      async ({ actorUserId, body, organizationId, set }) => {
        const result = await createProjectUseCase(
          { ...body, actorUserId, organizationId },
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
      async ({ actorRole, organizationId, params, set }) => {
        const result = await archiveProjectUseCase(
          { actorRole, organizationId, projectId: params.projectId },
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
