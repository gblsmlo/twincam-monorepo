import { type SQL, sql } from 'drizzle-orm'

import type { WorkspaceTx } from './client'

/**
 * A Drizzle transaction (or db) handle with the full builder API available:
 * `tx.query.*`, `tx.select()`, `tx.insert()`, `tx.update()`, `tx.delete()` and
 * `tx.execute(sql)`. The workspace boundary delivers this to repositories so
 * the Drizzle builder is the default contract, not `execute(SQL)`.
 *
 * `execute(sql)` stays available for intentional raw SQL: RLS `set_config`,
 * CTEs, PostgreSQL functions and pointed escapes.
 */
export type WorkspaceExecutor = {
  execute(query: SQL): Promise<unknown>
}

type Transactional<Tx> = {
  transaction<T>(operation: (tx: Tx) => Promise<T>): Promise<T>
}

type WorkspaceContextRow = {
  workspace_id: string | null
}

const readWorkspaceContext = async (tx: WorkspaceExecutor) => {
  const rows = (await tx.execute(
    sql`select nullif(current_setting('app.workspace_id', true), '') as workspace_id`,
  )) as WorkspaceContextRow[]

  return rows[0]?.workspace_id ?? null
}

/**
 * The role every tenant-aware statement runs as. It owns nothing and cannot log
 * in: it exists so row level security has a role to apply to, since the policy
 * is invisible to the owner and to any superuser. Created by the migration that
 * introduced the first tenant-owned table.
 */
export const WORKSPACE_RUNTIME_ROLE = 'twincam_workspace'

/**
 * `SET ROLE` takes no parameter, so the identifier is interpolated. It is this
 * module constant and never external input, and `SET LOCAL` reverts it when the
 * transaction ends — a pooled connection never carries the role to the next
 * caller.
 */
const enterWorkspaceRole = async <Tx extends WorkspaceExecutor>(tx: Tx): Promise<void> => {
  try {
    await tx.execute(sql`set local role ${sql.raw(WORKSPACE_RUNTIME_ROLE)}`)
  } catch (cause) {
    throw new Error(
      `The workspace role "${WORKSPACE_RUNTIME_ROLE}" is missing. Apply the migrations with \`bun run db:migrate\`.`,
      { cause },
    )
  }
}

export const applyWorkspaceContext = async <Tx extends WorkspaceExecutor>(
  tx: Tx,
  workspaceId: string,
): Promise<void> => {
  await tx.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`)

  const currentWorkspaceId = await readWorkspaceContext(tx)
  if (currentWorkspaceId !== workspaceId) {
    throw new Error('Workspace database context was not applied')
  }

  await enterWorkspaceRole(tx)
}

/**
 * Runs `operation` inside a Drizzle transaction with the workspace RLS context
 * applied. The `tx` passed to `operation` is the full Drizzle transaction
 * (builder + execute), not a SQL-only executor.
 */
const withWorkspaceTransactionOn = async <T, Tx>(
  database: Transactional<Tx>,
  workspaceId: string,
  operation: (tx: Tx) => Promise<T>,
): Promise<T> =>
  database.transaction(async (tx) => {
    await applyWorkspaceContext(tx as unknown as WorkspaceExecutor, workspaceId)
    return operation(tx)
  })

export const withWorkspaceTransaction = async <T>(
  workspaceId: string,
  operation: (tx: WorkspaceTx) => Promise<T>,
): Promise<T> => {
  const { db } = await import('./client')
  return withWorkspaceTransactionOn<T, WorkspaceTx>(db, workspaceId, operation)
}
