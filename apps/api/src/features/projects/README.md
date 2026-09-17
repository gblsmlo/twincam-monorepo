# projects — the reference slice

The one capability the starter ships end to end (Decision 018). It exists to be
read, copied and then renamed or deleted: nothing else in the repository depends
on it.

What it proves, and where:

| Claim | Evidence |
| --- | --- |
| A tenant-owned table is isolated by the database | `projects.integration.test.ts` |
| The contract is validated at the boundary, not in the handler | `projects.routes.test.ts` |
| A module's `derive` does not reach another module | `projects.routes.test.ts` § module scope |
| The typed client compiles against the route | `apps/web/src/features/projects/http/` |
| The chain answers in a browser | `e2e/projects/projects-journey.spec.ts` |

## Authorities

| Responsibility | Owner |
| --- | --- |
| Lengths and closed catalogues | `@twincam/core/projects` § `field-rules.ts`, read by the column too |
| Public contract, error codes | `@twincam/core/projects` § `schemas.ts` |
| What the use cases need from persistence | `@twincam/core/projects` § `contracts.ts` |
| Who may archive, id generation, description normalization | `@twincam/core/projects` § `use-cases/` |
| HTTP surface, status, actor context | `projects.routes.ts` |
| Queries, cursor, constraint classification | `projects-persistence.ts` |
| Row → contract conversion, and the read projection | `projects.mapper.ts` |
| The transaction boundary, and the workspace binding | `repository.ts` |
| Journey, URL state, cache, form | `apps/web/src/features/projects/` |

## Flow

```text
POST /api/projects
  -> createAuthGuard()            401/403 before anything else
  -> derive({ as: 'local' })      actorContext -> organizationId, role, userId
  -> body: createProjectRequestSchema
  -> createProject(command, { generateId, repository })
  -> repository.createProject     opens the transaction (Decision 019)
  -> withWorkspaceTransaction     set_config + SET LOCAL ROLE (Decision 017)
  -> operations.createProject     runs inside it, and opens none of its own
  -> insert ... onConflictDoNothing -> Result
  -> 201 { project } | 409 { error: { code: 'project_name_taken' } }
```

Reading is one step shorter on purpose: no use-case trigger applies to a
filtered list, so `GET /api/projects` calls the port directly. A module that
exists only to forward a method is the thing this omission demonstrates.

## By task

| Task | Start at |
| --- | --- |
| Add a field to a project | `field-rules.ts` if it has a limit, then `schemas.ts`, the table, `projectSelect` |
| Add a filter to the listing | `projectListQuerySchema`, then `listProjects` |
| Add a state transition | a use case, then a `POST /:projectId/<verb>` route |
| Change who may archive | `canArchiveProject`, read by the use case and by the route file |
| Make two writes atomic | one entry in `repository.ts` running both inside a single `inWorkspace` |
| Change the copy of an error | the `message` in the adapter; the `code` is contract |

## Adding an operation

1. Does the route need a policy, more than one entity, a generated id, reuse or
   more than one repository call? If not, extend the port and call it directly.
2. Put the schema in `@twincam/core/projects`, never inline in the route.
3. Implement in `projects-persistence.ts`, as an operation that receives the
   transaction and opens none. `repository.ts` decides the boundary.
4. Classify the expected constraint failure at the persistence boundary and
   return a `Result`. A driver message is never a contract.
5. Cover it in `projects.routes.test.ts` with an injected repository, and in
   `projects.integration.test.ts` when it touches isolation.

## Raw SQL exceptions

None in this slice. The two in the workspace boundary are listed in
[`packages/infra/database/README.md`](../../../../../packages/infra/database/README.md).

## Anti-patterns this slice avoids

- An `organizationId` read from body, query or header instead of the actor.
- A `safeParse` inside the handler, which makes Eden and OpenAPI see `unknown`.
- A generic `PATCH` for a state transition.
- A `where` without the organization, on the grounds that the policy covers it.
- A driver message inspected by substring to classify a conflict.
- A `repository.ts` that grew SQL, a `*Row` type or a mapper.
- An operation that opens its own transaction, which no caller can then compose
  with a second write (Decision 019).

## Removing this slice

A product that does not want `projects` deletes, in one commit:

- `apps/api/src/features/projects/` and its line in `apps/api/src/app.ts`
- the `Projects` tag in `apps/api/src/openapi.ts`
- `packages/core/src/projects/` and the `./projects` subpath
- `apps/web/src/features/projects/`, the route file and the nav entry
- the projects stories and `e2e/projects/`
- a migration dropping the table (the grant goes with it)

What stays, because it is not about projects: the workspace role and the
isolation mechanism (Decision 017), `requirePostgres`, the
`test:unit`/`test:integration` split, `errorEnvelopeSchema` in Core, and
`withFeatureSurface` in the catalog.

Renaming is usually the better move: the chain already works, and the name is
the smallest part of it.
