import { z } from 'zod'

import { projectDescriptionRule, projectNameRule, projectStatuses } from './field-rules'

export const projectStatusSchema = z.enum(projectStatuses)

export const projectSchema = z
  .object({
    createdAt: z.string().datetime(),
    description: z.string().nullable(),
    id: z.string().min(1),
    name: z.string().min(1).max(projectNameRule.max),
    status: projectStatusSchema,
    updatedAt: z.string().datetime(),
  })
  .strict()

export const createProjectRequestSchema = z
  .object({
    // The numbers come from `field-rules`, the message included: a limit that
    // changes without the copy changing tells the person the wrong rule.
    description: z
      .string()
      .trim()
      .max(
        projectDescriptionRule.max,
        `A descrição pode ter no máximo ${projectDescriptionRule.max} caracteres.`,
      )
      .optional(),
    name: z
      .string()
      .trim()
      .min(projectNameRule.min, `Informe um nome com pelo menos ${projectNameRule.min} caracteres.`)
      .max(projectNameRule.max, `O nome pode ter no máximo ${projectNameRule.max} caracteres.`),
  })
  .strict()

/**
 * The cursor is opaque to the client: it is issued by the listing and returned
 * unchanged. Only the persistence adapter knows how to read it, which is why an
 * unreadable cursor is a validation failure of that adapter, not of this schema.
 */
export const projectListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(80).optional(),
  status: projectStatusSchema.optional(),
})

/**
 * `nextCursor` is how the client learns there is more, and there is no `total`:
 * a count over the same filter costs an aggregate on every page and has to run
 * in the page's transaction to agree with it. The divergence from the vault's
 * `ELYSIA-TYPE-13`, which assumes offset pagination, is Decision 021.
 */
export const projectListResponseSchema = z
  .object({
    items: z.array(projectSchema),
    nextCursor: z.string().nullable(),
  })
  .strict()

export const projectParamsSchema = z
  .object({
    projectId: z.string().min(1),
  })
  .strict()

export const projectResponseSchema = z
  .object({
    project: projectSchema,
  })
  .strict()

/**
 * The stable half of an expected failure. The route maps the `kind` to a status
 * and the web routes on the `code`; the message is diagnostic and may change.
 */
export const projectErrorCodes = {
  alreadyArchived: 'project_already_archived',
  archiveForbidden: 'project_archive_forbidden',
  invalidCursor: 'project_invalid_cursor',
  nameTaken: 'project_name_taken',
  notFound: 'project_not_found',
} as const

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>
export type ProjectParams = z.infer<typeof projectParamsSchema>
export type ProjectResponse = z.infer<typeof projectResponseSchema>
