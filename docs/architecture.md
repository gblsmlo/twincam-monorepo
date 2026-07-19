# Starter architecture

Twincam is a domain-neutral foundation for tenant-aware SaaS applications. Its
permanent product scope is identity and organizations. Every new business
capability should be added as a vertical slice without moving authentication,
tenancy or persistence rules into the web layer.

## Runtime map

| Workspace | Responsibility |
| --- | --- |
| `apps/web` | TanStack Start routes, auth screens, organization onboarding and the application shell |
| `apps/api` | Elysia HTTP adapter, Better Auth handler and protected-route actor resolution |
| `packages/core` | Framework-independent public contracts, errors and `Result` |
| `packages/auth` | Better Auth server/client configuration, organization policy and invitation outbox |
| `packages/infra/database` | Drizzle schema, migrations, PostgreSQL client and seed |
| `packages/infra/env` | Runtime-specific environment validation |
| `packages/observability` | Structured logs and security/audit events |
| `packages/ui` | Domain-neutral UI primitives |

Dependencies point inward: Web and API may depend on Core contracts; API may
bridge Auth and Database; Core never imports a framework or infrastructure
package. The web app never imports Drizzle schemas.

## Identity and organization boundary

Authentication answers **who is making the request**. The active organization
and membership answer **which tenant the request may access**.

Protected API routes must resolve the server session, active organization and
membership before calling a use case. Client-supplied organization IDs, roles or
ownership claims are never authorization evidence. A user without an
organization may access onboarding, but not a tenant-scoped capability.

The starter includes these identity tables:

- `users`, `sessions`, `accounts`, `verifications` and `two_factors`;
- `organizations`, `members` and `invitations`;
- `notification_outbox` for replaceable delivery of auth and invitation emails.

Organization deletion is disabled by default. Owner-preservation hooks prevent
removing or demoting the last owner. Invitations require a verified email and
expire after 48 hours.

## Adding the first business capability

1. Define public input/output contracts in `packages/core/src/contracts/<capability>.ts`.
2. Implement framework-independent rules and use cases in `packages/core`.
3. Add tenant-owned tables and migrations in `packages/infra/database`.
4. Add negative isolation tests with two organizations, no tenant context and
   invalid membership before exposing the data.
5. Map domain failures to HTTP in a thin module under `apps/api/src/routes`.
6. Build the UI under `apps/web/src/features/<capability>` and keep the file
   route limited to loading, redirects and composition.
7. Add only reusable, domain-neutral primitives to `packages/ui`.

Tenant-owned rows should carry an `organization_id` foreign key. Queries must
derive that value from the resolved actor context, never from an unchecked
request field. Add PostgreSQL row-level security when business data is
introduced and validate `USING`, `WITH CHECK`, no-context access and rollback.

## Replaceable edges

- Email delivery consumes `notification_outbox`; choose a provider in the new product.
- Social login providers can be added to `packages/auth` without changing Core.
- Product-specific roles should be modeled deliberately. The starter keeps only
  Better Auth organization roles: `owner`, `admin` and `member`.
- Billing, analytics, queues and file storage are intentionally absent.

## Production checklist

- Generate unique `BETTER_AUTH_SECRET` and database credentials.
- Configure exact trusted origins and public URLs.
- Replace local seed credentials or disable the seed in deployed environments.
- Connect and monitor the notification outbox.
- Add rate limiting at the public edge.
- Back up PostgreSQL and rehearse migration rollback.
- Add tenant-isolation tests with the first business-owned table.
