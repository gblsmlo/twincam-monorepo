/**
 * The evidence a tenant-owned table owes before its data is exposed: two
 * organizations, `WITH CHECK`, access without context and rollback. It runs
 * against real PostgreSQL because that is the only place the policy exists —
 * a mocked database would agree with whatever the application asserts.
 *
 *     docker compose up -d postgres && bun run db:migrate && bun run test
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { isErr, isOk } from '@twincam/core/result'
import { db } from '@twincam/infra-database/client'
import { organizations, projects, users } from '@twincam/infra-database/schema'
import { WORKSPACE_RUNTIME_ROLE, withWorkspaceTransaction } from '@twincam/infra-database/workspace'
import { eq, sql } from 'drizzle-orm'

import { requirePostgres } from '../../test/postgres'
import { createDrizzleProjectsRepository } from './repository'

const repositoryFor = createDrizzleProjectsRepository
const createdOrganizationIds: string[] = []
const userId = `user_${crypto.randomUUID()}`

const createOrganization = async (): Promise<string> => {
  const id = `org_${crypto.randomUUID()}`

  await db.insert(organizations).values({ id, name: `Workspace ${id}`, slug: id })
  createdOrganizationIds.push(id)

  return id
}

const insertProject = (organizationId: string, name: string) =>
  repositoryFor(organizationId).createProject({
    createdByUserId: userId,
    description: null,
    name,
    projectId: `project_${crypto.randomUUID()}`,
  })

/** Drizzle wraps a driver failure in its own message; the cause carries the reason. */
const failureText = (error: unknown): string => {
  const messages: string[] = []
  let current: unknown = error

  while (current instanceof Error) {
    messages.push(current.message)
    current = current.cause
  }

  return messages.join(' | ')
}

const rejectionOf = (operation: Promise<unknown>): Promise<unknown> =>
  operation.then(
    () => null,
    (error: unknown) => error,
  )

/** What the session looks like outside a workspace transaction. */
const readSessionState = async (): Promise<{ role: string; workspaceId: string | null }> => {
  const rows = (await db.execute(
    sql`select current_user as role, nullif(current_setting('app.workspace_id', true), '') as workspace_id`,
  )) as Array<{ role: string; workspace_id: string | null }>

  return { role: rows[0]?.role ?? '', workspaceId: rows[0]?.workspace_id ?? null }
}

beforeAll(async () => {
  await requirePostgres(['projects'])
  await db.insert(users).values({
    email: `${userId}@twincam.test`,
    id: userId,
    name: 'Integration Actor',
  })
})

afterAll(async () => {
  // The organization cascade removes its projects: referential actions are not
  // subject to the policy, which is why this cleanup needs no workspace context.
  for (const organizationId of createdOrganizationIds) {
    await db.delete(organizations).where(eq(organizations.id, organizationId))
  }

  await db.delete(users).where(eq(users.id, userId))
})

describe('projects tenant isolation', () => {
  test('one workspace never reads the rows of another', async () => {
    const first = await createOrganization()
    const second = await createOrganization()

    await insertProject(first, 'Plano de contas')
    await insertProject(second, 'Plano de contas')

    const page = await repositoryFor(first).listProjects({})

    expect(isOk(page)).toBe(true)
    expect(isOk(page) && page.value.items.map((item) => item.name)).toEqual(['Plano de contas'])
    expect(isOk(page) && page.value.items).toHaveLength(1)
  })

  test('WITH CHECK refuses a row written for another workspace', async () => {
    const first = await createOrganization()
    const second = await createOrganization()

    const failure = await rejectionOf(
      withWorkspaceTransaction(first, (tx) =>
        tx.insert(projects).values({
          createdByUserId: userId,
          id: `project_${crypto.randomUUID()}`,
          name: 'Contrabando',
          organizationId: second,
        }),
      ),
    )

    expect(failureText(failure)).toMatch(/row-level security/i)

    const page = await repositoryFor(second).listProjects({})
    expect(isOk(page) && page.value.items).toHaveLength(0)
  })

  test('without workspace context the table answers nothing, not everything', async () => {
    const organizationId = await createOrganization()
    await insertProject(organizationId, 'Fora de contexto')

    // The workspace role with no `app.workspace_id`: the policy compares the
    // column with NULL, every row falls out, and a forgotten context reads
    // nothing instead of reading every organization.
    const visible = await db.transaction(async (tx) => {
      await tx.execute(sql`set local role ${sql.raw(WORKSPACE_RUNTIME_ROLE)}`)
      return tx.select({ id: projects.id }).from(projects)
    })

    expect(visible).toEqual([])
  })

  test('a failed transaction leaves neither the row nor the context behind', async () => {
    const organizationId = await createOrganization()

    const failed = withWorkspaceTransaction(organizationId, async (tx) => {
      await tx.insert(projects).values({
        createdByUserId: userId,
        id: `project_${crypto.randomUUID()}`,
        name: 'Revertido',
        organizationId,
      })

      throw new Error('deliberate failure inside the workspace transaction')
    })

    await expect(failed).rejects.toThrow('deliberate failure inside the workspace transaction')

    const page = await repositoryFor(organizationId).listProjects({})

    expect(isOk(page) && page.value.items).toEqual([])

    // `SET LOCAL` and the context die with the transaction: the pooled
    // connection does not hand either to the next caller.
    const session = await readSessionState()
    expect(session.workspaceId).toBeNull()
    expect(session.role).not.toBe(WORKSPACE_RUNTIME_ROLE)
  })
})

describe('projects persistence', () => {
  test('the unique name is scoped to the organization', async () => {
    const first = await createOrganization()
    const second = await createOrganization()

    expect(isOk(await insertProject(first, 'Onboarding'))).toBe(true)

    const duplicate = await insertProject(first, 'Onboarding')
    expect(isErr(duplicate)).toBe(true)
    expect(isErr(duplicate) && duplicate.error.kind).toBe('conflict')

    expect(isOk(await insertProject(second, 'Onboarding'))).toBe(true)
  })

  test('filters by name fragment without treating % as a wildcard', async () => {
    const organizationId = await createOrganization()

    await insertProject(organizationId, 'Migração de dados')
    await insertProject(organizationId, 'Descoberta')
    await insertProject(organizationId, '100% cobertura')

    const found = await repositoryFor(organizationId).listProjects({ q: 'desc' })
    expect(isOk(found) && found.value.items.map((item) => item.name)).toEqual(['Descoberta'])

    const literal = await repositoryFor(organizationId).listProjects({ q: '100%' })
    expect(isOk(literal) && literal.value.items.map((item) => item.name)).toEqual([
      '100% cobertura',
    ])
  })

  test('walks the whole collection through the cursor, without repeating a row', async () => {
    const organizationId = await createOrganization()

    for (let index = 0; index < 21; index += 1) {
      await insertProject(organizationId, `Projeto ${String(index).padStart(2, '0')}`)
    }

    const first = await repositoryFor(organizationId).listProjects({})
    expect(isOk(first) && first.value.items).toHaveLength(20)
    expect(isOk(first) && first.value.nextCursor).not.toBeNull()

    const cursor = isOk(first) ? (first.value.nextCursor ?? undefined) : undefined
    const second = await repositoryFor(organizationId).listProjects({ cursor })

    expect(isOk(second) && second.value.items).toHaveLength(1)
    expect(isOk(second) && second.value.nextCursor).toBeNull()

    const names = [
      ...(isOk(first) ? first.value.items.map((item) => item.name) : []),
      ...(isOk(second) ? second.value.items.map((item) => item.name) : []),
    ]

    expect(new Set(names).size).toBe(21)
  })

  test('refuses a cursor it did not issue', async () => {
    const organizationId = await createOrganization()

    const result = await repositoryFor(organizationId).listProjects({ cursor: 'not-a-cursor' })

    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.kind).toBe('validation')
  })

  test('archives once, and refuses the second attempt', async () => {
    const organizationId = await createOrganization()
    const created = await insertProject(organizationId, 'Encerramento')
    const projectId = isOk(created) ? created.value.id : ''

    const archived = await repositoryFor(organizationId).archiveProject({ projectId })
    expect(isOk(archived) && archived.value.status).toBe('archived')
    expect(isOk(archived) && archived.value.updatedAt > archived.value.createdAt).toBe(true)

    const again = await repositoryFor(organizationId).archiveProject({ projectId })
    expect(isErr(again) && again.error.kind).toBe('conflict')
  })

  test('does not archive a project that belongs to another workspace', async () => {
    const owner = await createOrganization()
    const stranger = await createOrganization()
    const created = await insertProject(owner, 'Alheio')
    const projectId = isOk(created) ? created.value.id : ''

    const result = await repositoryFor(stranger).archiveProject({ projectId })

    expect(isErr(result) && result.error.kind).toBe('not_found')
  })
})
