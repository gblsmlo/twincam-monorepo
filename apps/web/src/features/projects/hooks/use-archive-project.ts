import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Project } from '@twincam/core/projects'
import { toastManager } from '@twincam/ui/components/toast'

import { projectsFeedback } from '../feedback'
import { archiveProject } from '../http/archive-project'
import { projectsQueryKey } from '../query-options'

export function useArchiveProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (project: Project) => archiveProject(project.id),
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Não foi possível arquivar o projeto.'

      toastManager.add(projectsFeedback.archive.failure(message))
    },
    onSuccess: async (project) => {
      // Only this feature's key: a mutation that had to invalidate another
      // feature's cache would belong to that other feature.
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey })
      toastManager.add(projectsFeedback.archive.success(project.name))
    },
  })
}
