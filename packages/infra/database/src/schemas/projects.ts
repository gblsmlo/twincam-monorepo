import { projectNameRule } from '@twincam/core/projects/field-rules'
import { createInsertSchema } from 'drizzle-zod'

import { projects } from '../schema'

/**
 * The row as it is written, derived from the table (`DRZ-ZOD-01`): column
 * lengths, nullability and defaults come from the column and are never
 * restated here. The second argument carries the one rule a column cannot
 * express — a minimum length — rather than an `.extend()` from outside, which
 * would survive the column being removed.
 *
 * This is the third of the three validations, the one that guarantees the
 * invariant: the HTTP boundary already refused a malformed body, and this
 * refuses a malformed write from whoever did not come through it.
 */
export const projectInsertSchema = createInsertSchema(projects, {
  name: (schema) => schema.trim().min(projectNameRule.min),
})
