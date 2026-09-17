# Decision 020: the column owns the field rule, the contract owns the shape

## Status

Active. Recorded on 2026-09-17, with the `projects` slice.

## Context

Decision 002 says a public contract is declared in Zod and never derived from a
Drizzle schema, and Decision 012 says one contract has one type. Both hold. But
"declared" had been read as "unrelated", and the result was measurable in the
first tenant-owned table:

- `createProjectRequestSchema` refused a name over 80 characters; the column was
  `text` and accepted ten megabytes. The database did not refuse what the
  contract refused, so a migration, a job or a second service could write a row
  no client could have produced.
- `status` was a closed catalogue in Zod and free text in PostgreSQL.
- `packages/infra/database/src/schemas/users.ts` derived row schemas with
  `drizzle-zod` and nothing imported them. The house rule `DRZ-ZOD-01` — row
  validation derives from the table — was written down and applied nowhere.

The question "should the contract be derived from the table instead" was
measured rather than argued, in a browser bundle and in a REPL:

| Measurement | Result |
| --- | --- |
| A module exporting a derived schema, built for the browser | 327 KB against 283 KB for the declared one: **+43 KB**, because `drizzle-orm/pg-core` comes with it |
| `createSelectSchema` on a `timestamp` column | `ZodDate` — the ISO string the wire carries is an override either way |
| `createSelectSchema` on `varchar(80)` | `.max(80)`: the column's constraint does travel into Zod |
| `.pick()` over a derived schema | keeps the constraint |

So derivation pays where the schema stays on the server, and costs where it
crosses to the browser. And the column can carry the rule.

## Options considered

1. **Derive the public contract from the table.** One declaration, and the
   client ships the database schema. `createdAt` still needs an override, and
   `.omit()` — the shape a derivation reaches for — is a deny-list: the column
   added next year joins the contract by itself.
2. **Leave the two declarations unrelated.** No new dependency, and the number
   keeps two owners, which is how the column ended up accepting what the
   contract refuses.
3. **The column owns the field rule; the contract owns the shape; both read the
   same constant.**

## Decision

Adopt option 3, in three tiers.

### The rule lives in `field-rules.ts`, in plain TypeScript

`packages/core/src/<capability>/field-rules.ts` holds the lengths and the closed
catalogues as `const`. No Zod, so the database package can read them without
importing a schema library to declare a column. The message the person reads is
built from the same constant: a limit that changes without the copy changing
tells them the wrong rule.

### The column carries the constraint

`varchar('name', { length: projectNameRule.max })` instead of `text`, and a
`check` constraint built from the statuses. Verified against PostgreSQL: the
column is `character varying(80)` and rejects 81 characters;
`projects_status_check` rejects `'deleted'`. Both are covered by the integration
suite through the path that does not come from HTTP.

### Infra derives the internal write schema, and it has a consumer

`packages/infra/database/src/schemas/<table>.ts` derives with
`createInsertSchema` (`DRZ-ZOD-01`), adds through the second argument only what
a column cannot express (`DRZ-ZOD-02`), and the slice's adapter parses the write
with it. A derived schema with no consumer is not a pattern, it is an export.

### Core keeps declaring the public shape

Field selection, presentation (`Date` → ISO string), the closed catalogue and
the messages stay declared in `packages/core`. The contract remains free of
Drizzle, and the web bundle carries none: no client asset mentions
`drizzle-orm` after this change.

### `packages/infra/database` may depend on `@twincam/core`

A new edge in the dependency map, pointing inward, to the constants only. Core
has no dependency beyond Zod, so no cycle is possible, and the explicit negative
stands unchanged: **core never imports infra-database**.

## Consequences

- A field rule has one owner, and it is the one the database enforces.
- What the contract refuses, the database refuses too — for whoever skips the
  contract.
- `schemas/<table>.ts` stops being a pattern nobody applies.
- The public contract, the web bundle and Decision 002 are untouched.
- A new tenant-owned table has one more file to write, and it is four constants.

## Revisit when

- `drizzle-zod` is replaced by the native schema generation of `drizzle-orm` v1.
  The derivation is confined to Infra precisely so this migration is one file
  per table, on the server, with no contract and no frontend involved.
- Core needs anything from Infra beyond constants. The edge is one-way by
  construction; the day it is not, this decision is what has to change.
- A field rule stops being expressible as a column constraint — a cross-field
  rule, a conditional catalogue. It stays in the contract, and the reason is
  recorded here rather than silently.

## Related

- [`docs/decisions/README.md`](README.md) resolves number → file → state.
- Decisions 002, 004 and 012.
- `packages/core/src/projects/field-rules.ts`,
  `packages/infra/database/src/schemas/projects.ts`.
- [`packages-implementation-guide.md`](../engineering/packages-implementation-guide.md)
  § Expected dependency map.
