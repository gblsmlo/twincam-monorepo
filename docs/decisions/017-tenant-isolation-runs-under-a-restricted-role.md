# Decision 017: tenant isolation runs under a restricted role, not under the connection's

## Status

Active. Recorded on 2026-09-17, with the first tenant-owned table (`projects`).

## Context

Until this change the starter had no tenant-owned table, so row-level security
was a plan, not a running mechanism. `withWorkspaceTransaction` applied
`set_config('app.workspace_id', …, true)` and verified it, and every guide said
RLS was the mandatory boundary while the explicit `organization_id` filter was
defense in depth.

The first table made the mechanism executable, and executing it produced a
measurement: the policy was declared, `pg_class` reported
`relrowsecurity = true` and `relforcerowsecurity = true`, and the isolation test
still read every organization's rows. `pg_roles` explained it — the role the
container bootstraps from `POSTGRES_USER`, the same one `DATABASE_URL` carries,
is `rolsuper = true`, `rolbypassrls = true`.

PostgreSQL ignores every policy for a superuser, and ignores it for the table
owner unless the table is `FORCE`d. The runtime was both. So the isolation the
documentation promised was being provided, in full, by the explicit filter in
the `where` clause — the layer the same documentation calls "defense in depth".
A forgotten filter would have read across tenants, silently, with the policy in
place and the tests green.

## Options considered

1. **Declare the policy and trust the explicit filter.** Zero infrastructure,
   and it is what was already happening. It makes "RLS is the mandatory
   boundary" false, and turns every future `where` into a security control
   maintained by review.
2. **A second login role in the connection string.** The runtime connects as a
   non-superuser; migrations and seeds keep the owner. It is the textbook
   answer, and it adds a credential to create, configure, rotate and forget, an
   init script that only runs on a fresh volume, and a `.env` change that breaks
   every existing local database.
3. **A restricted role the transaction enters.** The connection keeps its
   privileges; `withWorkspaceTransaction` runs `SET LOCAL ROLE` before handing
   the transaction over. The role never logs in, so there is no credential; the
   switch dies with the transaction, so a pooled connection never carries it.

## Decision

Adopt option 3, with `FORCE ROW LEVEL SECURITY` kept on the table.

### Every tenant-aware statement runs as `twincam_workspace`

`applyWorkspaceContext` applies the workspace id and then enters the role. The
role owns nothing, cannot log in, and holds only the privileges a tenant table
grants it. A statement that escapes the workspace transaction does not lose the
policy quietly — it loses the privilege loudly.

### A tenant-owned table grants itself

The migration that creates a tenant-owned table also grants
`SELECT, INSERT, UPDATE, DELETE` on it to the workspace role. There is no
`ALTER DEFAULT PRIVILEGES`: a default would hand the role every future table,
including the identity tables that are global on purpose.

### The explicit `organization_id` filter stays

It is no longer the only thing standing between two tenants, and it is still
written: it states the invariant where the query is read, and it survives a
future role that legitimately bypasses RLS.

### `FORCE` stays on the table

The runtime is not the owner inside a workspace transaction, so `FORCE` is not
what makes today's isolation work. It is what keeps a maintenance script, a
seed or a migration from writing across tenants while connected as the owner.

## Consequences

- The four negative cases are provable, and they are proven:
  `apps/api/src/features/projects/projects.integration.test.ts` reads nothing
  without context, is refused by `WITH CHECK`, sees no other organization's rows
  and leaves neither row nor context behind after a rollback.
- Applying the migrations is a prerequisite of the runtime, not only of the
  schema: a missing role fails the first tenant query with a message naming
  `bun run db:migrate`.
- Adding a tenant-owned table has one more step, and it is in the same migration
  as the policy.
- The local superuser still reads everything outside a workspace transaction.
  That is the migration and seed path, and it is why `FORCE` is on.

## Revisit when

- The deployment gives the runtime its own login role. The `SET LOCAL ROLE` step
  becomes redundant and should be removed rather than layered.
- A tenant-aware operation needs a privilege the workspace role does not have.
  The answer is a grant in the table's migration, not widening the role.
- A read must legitimately cross organizations (an internal report, an
  administrative console). It gets its own role and its own path, recorded here.

## Related

- [`docs/decisions/README.md`](README.md) resolves number → file → state.
- Decision 004, and
  [`drizzle-first-persistence.md`](../engineering/drizzle-first-persistence.md)
  § Transactions and tenant isolation.
- `packages/infra/database/src/workspace.ts`,
  `packages/infra/database/drizzle/0002_force_workspace_isolation.sql` and
  `0003_workspace_runtime_role.sql`.
- [`packages/infra/database/README.md`](../../packages/infra/database/README.md)
  carries the raw-SQL exception list this added to.
