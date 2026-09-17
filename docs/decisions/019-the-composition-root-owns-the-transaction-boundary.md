# Decision 019: the composition root owns the transaction boundary

## Status

Active. Recorded on 2026-09-17, with the `projects` slice.

## Context

The repository already had the rule that matters at the destination. Decision
003 says operations that must share one transaction stay in the same module;
[`engineering-persistence`](../../.agents/skills/engineering-persistence/SKILL.md)
§ Passo 2 repeats it and lists "writes sharing an invariant split across
different transactions" as an anti-pattern; the Drizzle family adds `DRZ-TX-01`,
two or more writes that must be atomic belong in the same `db.transaction`.

None of them says **who may open one**. All three address the author of an
already-composed operation, and the `projects` slice was written by following
them: each port method wrapped its own body in `withWorkspaceTransaction`. The
rules were satisfied line by line and unreachable as a whole — by the time a
caller wanted two writes to be atomic, the first had already committed.

Measured against the local database, through the slice's own repository:

```text
HOJE   -> [ "hoje-commitado" ]     projeto criado, falha logo depois, linha permanece
DEPOIS -> [ "hoje-commitado" ]     a mesma escrita numa transação só: revertida
```

The first row is the defect: create the project, fail while writing the
`notification_outbox` row, and the project exists with no notification. The
person retries and receives `409 project_name_taken`.

The same shape had already produced a real defect elsewhere:
`apps/api/src/features/auth/actor.ts` read the user's only membership and wrote
it to the session in two separate statements, which the persistence skill uses
as its own worked example of what must be one transaction.

## Options considered

1. **Leave it, and compose inside the adapter.** A port method that does both
   writes keeps atomicity. Every composition then becomes a new port method, and
   the port drifts from "what the use case needs" to "one method per workflow" —
   the shape Decision 003 exists to prevent.
2. **Pass the transaction through the port.** The use case receives a `tx` and
   hands it down. It is the smallest diff and it puts a Drizzle handle in Core,
   which the guides list as an anti-pattern, and which would make the port
   unimplementable by anything that is not Drizzle.
3. **The operation receives the transaction; the composition root opens it.**

## Decision

Adopt option 3.

### An operation never opens a transaction

`createProjectsOperations(tx, organizationId)` returns the operations bound to a
transaction they did not begin. They read and write; they decide nothing about
where the unit of work starts or ends.

### `repository.ts` is the only place a transaction begins

An operation module never begins a unit of work, and the file that composes the
port is the one that does. That is grep-able, which makes it a review gate
rather than a convention:

```sh
# a rule: no operation opens a transaction — this must stay empty
rg -n "withWorkspaceTransaction|db\.transaction" apps/api/src/features --glob '*-persistence.ts'

# b list: every file that opens one must be a composition root
rg -l "withWorkspaceTransaction|db\.transaction" apps/api/src --glob '*.ts' --glob '!*.test.ts'
```

The second probe returns two files today: `features/projects/repository.ts`, the
composition root of the port, and `features/auth/actor.ts`, which owns its
operation directly because the auth slice has no port to compose. A slice
without a `repository.ts` has its composition root somewhere else; it does not
have none.

### The workspace is bound at construction

`createDrizzleProjectsRepository(organizationId)` binds the tenant once, and no
port input carries it. The route's `derive` — the only place that reads
`actorContext` — builds the repository, so there is no call site left that could
pass the right organization to two methods and the wrong one to the third. Route
dependencies are injected as a factory, not as an instance.

### A unit of work is added when a composition exists

The port gains an `inTransaction` method when a real composition needs it, with
the integration test that proves the rollback. Not before: a method with no
consumer is an export with no consumer.

## Consequences

- Atomic composition costs one entry in the composition root, and no operation
  changes to allow it.
- The transaction boundary and the tenant binding each have one owner, and both
  are visible in a single file per slice.
- The route builds a repository per request. That is a closure and an object; it
  is not a connection.
- A slice that copies `projects` copies the shape. A slice that does not shows
  up in the probe above.

## Revisit when

- A composition must span two capabilities. The boundary then sits above the
  per-capability repository, and a unit of work over several ports is a decision
  of its own, not an extension of this one.
- An operation needs a transaction that is not a workspace transaction — a
  global identity write inside a tenant flow. Today those live outside
  `features/`, and the first one that does not needs its owner named here.
- The runtime gains its own login role and `withWorkspaceTransaction` changes
  shape (Decision 017's revisit trigger). The owner does not change; the helper
  does.

## Related

- [`docs/decisions/README.md`](README.md) resolves number → file → state.
- Decisions 003 and 017.
- `apps/api/src/features/projects/repository.ts` is the reference implementation;
  its slice README carries the recipe.
- [`drizzle-first-persistence.md`](../engineering/drizzle-first-persistence.md)
  § Transactions and tenant isolation.
