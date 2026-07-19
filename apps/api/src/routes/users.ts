import { auth } from '@twincam/auth/server'
import { currentUserResponseSchema } from '@twincam/core/contracts/users'
import { Elysia } from 'elysia'
import type { ActorResolver } from '../auth/actor'

const unauthenticatedResponse = {
  error: {
    code: 'unauthenticated',
    message: 'Authentication required.',
  },
}

export const createUserRoutes = (
  resolveActor: ActorResolver = async (request) => {
    const { resolveSessionActorContext } = await import('../auth/actor')
    return resolveSessionActorContext(request)
  },
) =>
  new Elysia({ prefix: '/api/v1' }).get('/me', async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      set.status = 401
      return unauthenticatedResponse
    }

    const actorContext = await resolveActor(request)

    return currentUserResponseSchema.parse({
      organization: actorContext.ok
        ? {
            id: actorContext.context.organizationId,
            name: actorContext.context.organizationName,
            slug: actorContext.context.organizationSlug,
          }
        : null,
      role: actorContext.ok ? actorContext.context.role : null,
      user: {
        email: session.user.email,
        id: session.user.id,
        image: session.user.image ?? null,
        name: session.user.name?.trim() || session.user.email,
      },
    })
  })
