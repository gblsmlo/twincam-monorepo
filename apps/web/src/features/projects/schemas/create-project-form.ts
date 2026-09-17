import { createProjectRequestSchema } from '@twincam/core/projects'
import type { z } from 'zod'

/**
 * UX layer over the contract: a textarea always yields a string, while the
 * contract treats an absent description as `undefined`. The length rule is not
 * restated — it is unwrapped from the field the server already declares.
 */
export const createProjectFormSchema = createProjectRequestSchema.extend({
  description: createProjectRequestSchema.shape.description.unwrap(),
})

export type CreateProjectFormInput = z.input<typeof createProjectFormSchema>
export type CreateProjectFormValues = z.output<typeof createProjectFormSchema>
