import { type Project, projectStatusSchema } from '@twincam/core/projects'
import { projects } from '@twincam/infra-database/schema'

/**
 * The columns the slice reads. Declared once so the projection, the row type
 * and the mapper cannot drift apart, and so no query brings back a column no
 * one consumes.
 */
export const projectSelect = {
  createdAt: projects.createdAt,
  description: projects.description,
  id: projects.id,
  name: projects.name,
  status: projects.status,
  updatedAt: projects.updatedAt,
} as const

export type ProjectRow = Pick<typeof projects.$inferSelect, keyof typeof projectSelect>

export const mapProject = (row: ProjectRow): Project => ({
  createdAt: row.createdAt.toISOString(),
  description: row.description,
  id: row.id,
  name: row.name,
  // The column is `text`, like every other status in this schema. Parsing here
  // states the invariant instead of widening it: a value outside the catalogue
  // is a broken database, not a project the client should be handed.
  status: projectStatusSchema.parse(row.status),
  updatedAt: row.updatedAt.toISOString(),
})
