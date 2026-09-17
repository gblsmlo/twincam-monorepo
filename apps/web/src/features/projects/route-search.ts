import { projectListQuerySchema } from '@twincam/core/projects'
import { z } from 'zod'

/**
 * The URL contract of the listing. It derives the field from the HTTP contract
 * instead of restating the rule, and `.catch` keeps a hand-edited address from
 * breaking the route: an unusable value means "no filter", not a crash.
 */
export const projectsSearchSchema = z.object({
  q: projectListQuerySchema.shape.q.catch(undefined),
})

export type ProjectsSearch = z.infer<typeof projectsSearchSchema>
