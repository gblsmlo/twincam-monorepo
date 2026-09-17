import { Buffer } from 'node:buffer'

import {
  type DomainError,
  conflictError,
  notFoundError,
  validationError,
} from '@twincam/core/errors'
import type {
  ArchiveProjectInput,
  CreateProjectInput,
  Project,
  ProjectListFilter,
  ProjectListPage,
} from '@twincam/core/projects'
import { projectErrorCodes } from '@twincam/core/projects'
import { type Result, err, ok } from '@twincam/core/result'
import { projects } from '@twincam/infra-database/schema'
import { withWorkspaceTransaction } from '@twincam/infra-database/workspace'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'

import { mapProject, projectSelect } from './projects.mapper'

/** Server-owned page size: the listing exposes a cursor, never a page length. */
const PAGE_SIZE = 20

type ProjectCursor = {
  createdAt: string
  id: string
}

/**
 * Keyset pagination needs the tiebreaker the ordering uses, so the cursor
 * carries both `created_at` and `id`. It is opaque on purpose: encoding it
 * keeps the client from building one by hand and pinning this query shape.
 */
export const encodeProjectCursor = (row: { createdAt: Date; id: string }): string =>
  Buffer.from(`${row.createdAt.toISOString()}|${row.id}`, 'utf8').toString('base64url')

export const decodeProjectCursor = (cursor: string): ProjectCursor | null => {
  const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
  const separator = decoded.indexOf('|')

  if (separator < 1) {
    return null
  }

  const createdAt = decoded.slice(0, separator)
  const id = decoded.slice(separator + 1)

  if (id.length === 0 || Number.isNaN(Date.parse(createdAt))) {
    return null
  }

  return { createdAt, id }
}

/** `%` and `_` typed by a person are characters, not wildcards. */
const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, (match) => `\\${match}`)

export const listProjects = async (
  filter: ProjectListFilter,
): Promise<Result<ProjectListPage, DomainError<'validation'>>> => {
  const cursor = filter.cursor ? decodeProjectCursor(filter.cursor) : null

  if (filter.cursor && !cursor) {
    return err(
      validationError(
        projectErrorCodes.invalidCursor,
        'O cursor da listagem é inválido. Recarregue a lista.',
      ),
    )
  }

  const rows = await withWorkspaceTransaction(filter.organizationId, (tx) =>
    tx
      .select(projectSelect)
      .from(projects)
      .where(
        and(
          // Redundant with the policy, and kept: it states the invariant where
          // the query is read, and survives a role that bypasses RLS.
          eq(projects.organizationId, filter.organizationId),
          filter.status ? eq(projects.status, filter.status) : undefined,
          filter.q ? ilike(projects.name, `%${escapeLikePattern(filter.q)}%`) : undefined,
          cursor
            ? sql`(${projects.createdAt}, ${projects.id}) < (${cursor.createdAt}::timestamptz, ${cursor.id})`
            : undefined,
        ),
      )
      .orderBy(desc(projects.createdAt), desc(projects.id))
      // One extra row answers "is there a next page" without a second count.
      .limit(PAGE_SIZE + 1),
  )

  const page = rows.slice(0, PAGE_SIZE)
  const last = page.at(-1)

  return ok({
    items: page.map(mapProject),
    nextCursor: rows.length > PAGE_SIZE && last ? encodeProjectCursor(last) : null,
  })
}

export const createProject = async (
  input: CreateProjectInput,
): Promise<Result<Project, DomainError<'conflict'>>> =>
  withWorkspaceTransaction(input.organizationId, async (tx) => {
    const [row] = await tx
      .insert(projects)
      .values({
        createdByUserId: input.createdByUserId,
        description: input.description,
        id: input.projectId,
        name: input.name,
        organizationId: input.organizationId,
      })
      // The unique index decides the conflict, so two concurrent requests cannot
      // both pass. Reading the driver message to classify it would depend on
      // wording that is not a contract.
      .onConflictDoNothing({ target: [projects.organizationId, projects.name] })
      .returning(projectSelect)

    if (!row) {
      return err(
        conflictError(
          projectErrorCodes.nameTaken,
          'Já existe um projeto com este nome nesta organização.',
        ),
      )
    }

    return ok(mapProject(row))
  })

export const archiveProject = async (
  input: ArchiveProjectInput,
): Promise<Result<Project, DomainError<'conflict' | 'not_found'>>> =>
  withWorkspaceTransaction(input.organizationId, async (tx) => {
    // Read and write share the invariant "an active project becomes archived
    // once", so they share the transaction and the lock.
    const [current] = await tx
      .select({ id: projects.id, status: projects.status })
      .from(projects)
      .where(
        and(eq(projects.organizationId, input.organizationId), eq(projects.id, input.projectId)),
      )
      .for('update')

    if (!current) {
      return err(
        notFoundError(projectErrorCodes.notFound, 'Projeto não encontrado nesta organização.'),
      )
    }

    if (current.status === 'archived') {
      return err(
        conflictError(projectErrorCodes.alreadyArchived, 'Este projeto já está arquivado.'),
      )
    }

    const [row] = await tx
      .update(projects)
      .set({ status: 'archived', updatedAt: sql`now()` })
      .where(
        and(eq(projects.organizationId, input.organizationId), eq(projects.id, input.projectId)),
      )
      .returning(projectSelect)

    if (!row) {
      // The row was locked by this transaction: nobody else could remove it.
      throw new Error('The archived project vanished inside its own transaction')
    }

    return ok(mapProject(row))
  })
