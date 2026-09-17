/**
 * The executable form of Decision 017: a business table with an
 * `organization_id` is isolated by a policy, or it is not isolated at all.
 *
 * Reading the schema object instead of the migration is deliberate — the
 * migration is generated from it, so this fails at the moment the table is
 * declared, not after someone runs `db:generate`.
 */

import { describe, expect, test } from 'bun:test'
import type { PgTable } from 'drizzle-orm/pg-core'
import { getTableConfig } from 'drizzle-orm/pg-core'

import { authSchema, databaseSchema, projects } from './schema'

const TENANT_COLUMN = 'organization_id'

const identityTables = new Set(
  Object.values(authSchema).map((table) => getTableConfig(table as PgTable).name),
)

const businessTables = Object.values(databaseSchema)
  .map((table) => getTableConfig(table as PgTable))
  .filter((config) => !identityTables.has(config.name))

describe('tenant-owned tables', () => {
  test('every business table carrying the tenant column declares a policy', () => {
    const unprotected = businessTables
      .filter((config) => config.columns.some((column) => column.name === TENANT_COLUMN))
      .filter((config) => config.policies.length === 0)
      .map((config) => config.name)

    expect(unprotected).toEqual([])
  })

  test('the policy compares the tenant column with the workspace context', () => {
    const [policy] = getTableConfig(projects).policies

    expect(policy?.name).toBe('projects_workspace_isolation')
    // Both halves: `using` filters reads, `withCheck` refuses writes for another
    // organization. A policy with only the first one reads correctly and writes
    // across tenants.
    expect(policy?.using).toBeDefined()
    expect(policy?.withCheck).toBeDefined()
  })

  test('the status catalogue is closed by a constraint, not only by the schema', () => {
    const { checks } = getTableConfig(projects)

    expect(checks.map((constraint) => constraint.name)).toContain('projects_status_check')
  })

  test('identity tables stay global, and are not expected to carry a policy', () => {
    // `members`, `invitations` and `sessions` carry an organization id and are
    // reached outside the workspace transaction on purpose. The assertion keeps
    // the list above honest: if one of them gained a policy, the boundary moved
    // and this test is the place that says so.
    const withPolicy = Object.values(authSchema)
      .map((table) => getTableConfig(table as PgTable))
      .filter((config) => config.policies.length > 0)
      .map((config) => config.name)

    expect(withPolicy).toEqual([])
  })
})
