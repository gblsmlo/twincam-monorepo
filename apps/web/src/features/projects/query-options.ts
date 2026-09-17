import { infiniteQueryOptions } from '@tanstack/react-query'
import type { ProjectListResponse } from '@twincam/core/projects'

import { listProjects } from './http/list-projects'

export type ProjectsFilter = {
  q?: string
}

/** Every key of this feature hangs here, and only its own mutations touch it. */
export const projectsQueryKey = ['projects'] as const

/**
 * One definition for the loader and for the component: two would be two
 * freshness policies over the same resource, and the screen would show the
 * loader's page while the hook refetched its own.
 */
export const projectsQueryOptions = (filter: ProjectsFilter) =>
  infiniteQueryOptions({
    // Annotated because the page type and the cursor type infer from each
    // other; without it both collapse to `unknown`.
    getNextPageParam: (lastPage: ProjectListResponse) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listProjects({ cursor: pageParam, q: filter.q }),
    queryKey: [...projectsQueryKey, 'list', { q: filter.q ?? null }] as const,
  })
