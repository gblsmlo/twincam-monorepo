# @twincam/infra-database

Schema, client, migrations and the workspace transaction. It depends on no
application and never imports `@twincam/auth`.

## Public surface

| Subpath | Use |
| --- | --- |
| `./schema` | tables, indexes and policies |
| `./client` | the pool and `WorkspaceTx` |
| `./workspace` | `withWorkspaceTransaction`, `withActorWorkspaceTransaction` |
| `./schemas/users` | internal row schemas derived with `drizzle-zod` |

No raw SQL executor is exported. That absence is what keeps the Drizzle builder
the default rather than a preference (Decision 004).

## Tenant-owned tables

A table with an `organization_id` ships, in the same migration:

1. the column and its indexes;
2. `pgPolicy` comparing the column with `current_setting('app.workspace_id', true)`
   in `USING` and in `WITH CHECK`;
3. `ALTER TABLE … FORCE ROW LEVEL SECURITY`, which Drizzle Kit does not express;
4. `GRANT SELECT, INSERT, UPDATE, DELETE … TO twincam_workspace`.

And, in the same pull request, the four negative cases: two organizations,
`WITH CHECK`, access with no context and rollback. `projects` is the worked
example — the table in `src/schema.ts`, the migrations `0001`–`0003`, the suite
in `apps/api/src/features/projects/projects.integration.test.ts`.

The workspace role is not a credential: it cannot log in, and
`withWorkspaceTransaction` enters it with `SET LOCAL ROLE`, which the
transaction's end reverts (Decision 017).

## Raw SQL exception list

Full SQL at runtime is a documented exception with an owner, a category, a
justification and a proportional test. Migrating one back to the builder removes
its entry in the same pull request.

| Statement | Category | Owner | Why the builder does not cover it | Test |
| --- | --- | --- | --- | --- |
| `select set_config('app.workspace_id', …, true)` | `rls-context` | `src/workspace.ts` | session configuration is not a query the builder models | `projects.integration.test.ts` § without workspace context |
| `select nullif(current_setting('app.workspace_id', true), '')` | `rls-context` | `src/workspace.ts` | reads back the setting to prove it was applied | same |
| `set local role twincam_workspace` | `rls-context` | `src/workspace.ts` | `SET ROLE` takes no parameter and no builder form exists | `projects.integration.test.ts` § WITH CHECK, § rollback |

The role name is a module constant, never external input. No other statement in
this package is written as full SQL.

## Migrations

Run Drizzle Kit from this package; `drizzle.config.ts` uses paths relative to
it. `bun run db:generate` writes the schema diff, and
`drizzle-kit generate --custom` opens an empty file for what the diff cannot
express — `FORCE ROW LEVEL SECURITY` and the workspace role are the two the
starter needed. Validate a new migration on a clean database before merging.
