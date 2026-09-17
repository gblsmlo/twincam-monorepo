# Decision 018: the starter ships one reference slice, and it is removable

## Status

Active. Recorded on 2026-09-17, with `projects`.

## Context

The starter is domain-neutral by design: billing, analytics, product roles and
business entities belong to the product built on top of it. The rule exists so
the platform layer does not accumulate someone else's domain.

Kept literally, it also meant the repository documented a vertical slice it had
never executed. The delivery flow, the four build-order skills and the test plan
all described a chain — contract in Core, tenant-owned table, thin route, typed
client, feature, story, journey — with no instance of it. Three claims in that
description were unprovable while no tenant-owned table existed: that RLS is the
boundary, that the negative isolation cases are affordable, and that the same
`queryOptions` serve the loader and the component.

The first product built on the starter would have discovered all three, and
would have discovered them in its own domain, where a mistake is expensive to
undo.

## Options considered

1. **Keep the starter empty.** Maximum neutrality; the documented chain stays a
   description, and the first capability of every product is also the first
   rehearsal of the architecture.
2. **Ship several example capabilities.** More surface covered, and the product
   starts by deleting a product it did not write.
3. **Ship exactly one slice, complete, and say plainly how to remove it.**

## Decision

Adopt option 3, with `projects` as the slice.

### One slice, every layer, no shortcuts

`projects` carries a public contract and use cases in Core, a tenant-owned table
with its policy and grant, an adapter with cursor pagination and classified
constraint failures, a thin Elysia module, a typed `http/` client, a feature in
the shape of Decision 007, stories and an E2E journey. A layer it skipped would
be a layer the next capability has no example of.

### It is a rehearsal, not a product

`projects` decides nothing a product must accept: it has a name unique per
organization, an optional description, two states and one transition. No status
workflow, no ownership model, no permissions beyond the archive rule that exists
to demonstrate where a permission rule lives.

### Removing it is one commit, and the parts that stay are named

`apps/api/src/features/projects/README.md` § Removing this slice lists what goes
and what stays. What stays is what the slice paid for: the workspace role, the
raw-SQL exception list, `requirePostgres`, `test:unit`/`test:integration` and
`errorEnvelopeSchema` in Core. A product that renames the slice instead of
deleting it renames a working chain.

### Neutrality is preserved by scope, not by absence

The starter still ships no billing, no analytics, no product roles and no
delivery provider. It ships one capability whose only purpose is to be read,
copied and deleted.

## Consequences

- The claims in the guides are executable: the isolation suite, the contract
  chain and the story layer all run in CI against the slice.
- A new capability starts from a working example in this repository, not from a
  description of one.
- The starter carries a business-shaped table it does not need. That is the
  accepted cost, and it is bounded by the removal recipe.
- Upgrading a product that deleted the slice must not reintroduce it; the
  removal is a product decision the starter does not undo.

## Revisit when

- Two products in a row keep the slice instead of replacing it. It stopped being
  a rehearsal and became a feature, and the scope rule needs rewriting.
- The chain changes shape — a different client, a different router, a different
  validation boundary. The slice is updated with it or it starts teaching the
  wrong thing.
- Keeping the slice green costs more than the evidence it produces.

## Related

- [`docs/decisions/README.md`](README.md) resolves number → file → state.
- Decisions 002, 007 and 017.
- [`feature-delivery-flow.md`](../engineering/feature-delivery-flow.md) is the
  order the slice follows.
- `apps/api/src/features/projects/README.md`.
