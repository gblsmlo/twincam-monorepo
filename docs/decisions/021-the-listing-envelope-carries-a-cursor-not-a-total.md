# Decision 021: the listing envelope carries a cursor, not a total

## Status

Active. Recorded on 2026-09-17, with the `projects` listing.

## Context

`AGENTS.md` says a decision or guide in this repository always wins over the
technology skills installed from the maintainer's vault. This is the first time
that precedence is exercised deliberately, so it is written down rather than
left as a silent difference.

The house rule is `ELYSIA-TYPE-13`: a paginated listing must declare, in its
`response`, an envelope with `items`, `total` and `hasMore`. Its reason is
sound — a route that returns a raw array leaves the client unable to know
whether there is a next page, and pagination in the frontend becomes
guesswork.

This repository's own convention, in
[`engineering-api`](../../.agents/skills/engineering-api/SKILL.md) § Passo 5,
requires cursor pagination with a maximum limit and deterministic ordering. The
two meet on `total`, and keyset pagination has no cheap one: the count is a
separate aggregate over the same filter, it costs more as the table grows, and
it has to run in the same transaction as the page or it disagrees with the rows
it accompanies.

`GET /api/projects` answers `{ items, nextCursor }`.

## What the house rule protects, and where it stands here

| Property `ELYSIA-TYPE-13` protects | In this repository |
| --- | --- |
| The client knows whether there is more | `nextCursor !== null`. Named differently, present |
| The client does not recompute pagination | the server issues the cursor; the client returns it unchanged |
| Navigation is not offered while a page is in flight | `useInfiniteQuery` with `hasNextPage`; the "Carregar mais" button takes `loading`, and the `Button` primitive turns that into `disabled` |
| The screen can show how many there are | **absent.** No total, no numbered pages, no jump to page 7 |

Three of the four hold. The fourth is the divergence.

## Options considered

1. **Adopt the envelope with `total`.** One aggregate per page, in the same
   transaction as the rows — otherwise the total disagrees with the items and
   the symptom is a listing that skips or repeats a row. The cost is paid on
   every page and grows with the table.
2. **Move the listing to offset pagination**, which is what the house rule
   assumes. `OFFSET` degrades with volume, and the deepest pages are the slowest
   for exactly the people who scrolled that far.
3. **Keep the cursor envelope without a total, and record the divergence.**

## Decision

Adopt option 3.

### `nextCursor` is the contract for "there is more"

`nextCursor: string | null` in `projectListResponseSchema`. A client never
computes it, never parses it, and never builds one.

### A total is a separate decision, never a side effect of the page query

A listing that genuinely needs a count declares it as its own field, with its
own name and its own cost — an approximate count from the planner, or a second
endpoint. Turning the page query into an aggregate to satisfy a shape is how
the cost becomes invisible.

### A screen that needs numbered pages says so

That listing moves to offset pagination and records why. The two can coexist
across capabilities; what is not allowed is a cursor contract with numbered
pages bolted on top of it.

### A review that cites `ELYSIA-TYPE-13` gets this decision as the answer

Once. The house rule is not wrong; it assumes a listing this one is not.

## Consequences

- No aggregate runs per page, and the listing's cost does not grow with the
  table.
- The frontend uses `useInfiniteQuery`: the cursor is the page param, and the
  control that is disabled while fetching is the "load more" button rather than
  a pager.
- No "12 of 340" and no link straight to page N. A deep link to a listing
  carries the filter, not the position.
- Anything that needs a count — an admin screen, a report — needs its own field
  or its own endpoint, and pays for it explicitly.

## Revisit when

- A product requirement asks for a total or numbered pages on this listing. The
  decision is reversible, and reversing it is a contract change: the schema, the
  client and the cache.
- A listing's collection turns out to be small and bounded, where a count is
  free and the ordering is stable.
- The house rule changes to admit a cursor envelope, at which point this
  divergence closes on its own.

## Related

- [`docs/decisions/README.md`](README.md) resolves number → file → state.
- `ELYSIA-TYPE-13` and the `TSQ-PATTERN-*` family are vault rules, cited by name;
  `AGENTS.md` fixes their precedence against this repository's decisions.
- `packages/core/src/projects/schemas.ts` (`projectListResponseSchema`),
  `apps/api/src/features/projects/projects-persistence.ts` (the keyset query),
  `apps/web/src/features/projects/query-options.ts` (the infinite query).
