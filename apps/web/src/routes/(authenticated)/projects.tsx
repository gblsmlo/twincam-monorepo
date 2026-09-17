import { ProjectsPage, projectsQueryOptions, projectsSearchSchema } from '@features/projects'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { canArchiveProject } from '@twincam/core/projects'

export const Route = createFileRoute('/(authenticated)/projects')({
  beforeLoad: ({ context }) => {
    if (!context.currentOrganization || !context.currentRole) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: ProjectsRoute,
  loaderDeps: ({ search }) => ({ q: search.q }),
  // The same options the page consumes: the loader fills the cache the hook
  // reads, instead of a second definition with its own freshness.
  loader: ({ context, deps }) =>
    context.queryClient.ensureInfiniteQueryData(projectsQueryOptions({ q: deps.q })),
  validateSearch: projectsSearchSchema,
})

function ProjectsRoute() {
  const { currentRole } = Route.useRouteContext()
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <ProjectsPage
      // The screen offers what the server would allow, reading the same rule.
      canArchive={canArchiveProject(currentRole ?? '')}
      onQueryChange={async (query) => {
        await navigate({ search: query ? { q: query } : {} })
      }}
      query={q}
    />
  )
}
