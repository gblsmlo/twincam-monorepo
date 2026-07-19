import { Elysia } from 'elysia'

import type { ActorContext, ActorResolution, ActorResolver } from './actor'

export type AuthGuardOptions = {
  resolveActor?: ActorResolver
}

const defaultResolver: ActorResolver = async (request) => {
  const { resolveSessionActorContext } = await import('./actor')
  return resolveSessionActorContext(request)
}

const rejectionBody = (result: Extract<ActorResolution, { ok: false }>) => ({
  error: { code: result.code, message: result.message },
})

export const createAuthGuard = ({ resolveActor }: AuthGuardOptions = {}) =>
  new Elysia({ name: 'actor-context' })
    .derive({ as: 'scoped' }, async ({ request }) => {
      const result = await (resolveActor ?? defaultResolver)(request)
      if (!result.ok) {
        return { actorContext: null as ActorContext | null, actorRejection: result }
      }
      return { actorContext: result.context, actorRejection: null }
    })
    .onBeforeHandle({ as: 'scoped' }, ({ actorContext, actorRejection, set }) => {
      if (!actorContext && actorRejection) {
        set.status = actorRejection.status
        return rejectionBody(actorRejection)
      }
    })
