import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { projectErrorCodes } from '@twincam/core/projects'
import { toastManager } from '@twincam/ui/components/toast'
import { useForm } from 'react-hook-form'

import { projectsFeedback } from '../feedback'
import { createProject } from '../http/create-project'
import { ProjectsRequestError } from '../http/errors'
import { projectsQueryKey } from '../query-options'
import {
  type CreateProjectFormInput,
  type CreateProjectFormValues,
  createProjectFormSchema,
} from '../schemas/create-project-form'

export type { CreateProjectFormInput, CreateProjectFormValues }

/**
 * Owner of network, cache and feedback for the creation. The conflict is the
 * only server failure that goes back into a field: the person fixes the name
 * where they typed it, and everything else is a toast.
 */
export function useCreateProjectForm() {
  const queryClient = useQueryClient()
  const form = useForm<CreateProjectFormInput, unknown, CreateProjectFormValues>({
    defaultValues: { description: '', name: '' },
    mode: 'onSubmit',
    resolver: zodResolver(createProjectFormSchema),
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const project = await createProject(values)

      await queryClient.invalidateQueries({ queryKey: projectsQueryKey })
      toastManager.add(projectsFeedback.create.success(project.name))
      form.reset()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível criar o projeto.'

      if (error instanceof ProjectsRequestError && error.code === projectErrorCodes.nameTaken) {
        form.setError('name', { message, type: 'server' })
        return
      }

      toastManager.add(projectsFeedback.create.failure(message))
    }
  })

  return { form, onSubmit }
}
