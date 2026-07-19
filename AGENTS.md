# Agent Instructions

## Toolchain

- Use Bun `1.3.14`.
- Use Node `24.18.0`.
- Run `sh scripts/check-toolchain.sh` before diagnosing tool failures.
- Install dependencies with `bun install`.

## Validation

- Lint: `bun run lint:ci`
- Typecheck: `bun run typecheck`
- Tests: `bun run test`
- Build: `bun run build`

Run all four checks before requesting review.

## Architecture

- `apps/web`: React and TanStack Start client.
- `apps/api`: Elysia HTTP API and Better Auth handler.
- `packages/core`: framework-independent public contracts and primitives.
- `packages/auth`: Better Auth server/client configuration.
- `packages/infra/database`: Drizzle/PostgreSQL schema and tenant context.
- `packages/infra/env`: environment validation.
- `packages/observability`: structured logging and audit events.
- `packages/ui`: shared, domain-neutral UI.

Keep routes thin and business capabilities under feature folders. Client code
may import public Core contracts but never database schema. Root package barrels
must not initialize environment parsing, database clients or auth.

## Authentication and tenancy

- The server session is the source of truth for identity.
- Every protected API operation resolves an active organization and membership.
- Never trust organization, role or ownership claims supplied by the client.
- Never log secrets, cookies, passwords, MFA codes or authorization headers.
- Organization data must be isolated by database policy and negative tests.

Use Conventional Commits without AI attribution trailers.
