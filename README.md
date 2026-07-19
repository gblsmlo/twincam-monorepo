# Twincam Monorepo

Starter monorepo for tenant-aware SaaS products. It provides a reusable technical
foundation while intentionally shipping without a business domain.

The included product foundation is limited to:

- email/password authentication and two-factor authentication;
- organizations, memberships and invitations;
- active-organization session context;
- a protected web application shell;
- PostgreSQL, Drizzle, Elysia, React, TanStack Start and shared COSS UI.

## Requirements

- Bun `1.3.14`
- Node.js `24.18.0`
- Docker with Compose

## Local setup

```bash
cp .env.example .env
bun install
docker compose up -d postgres
bun run db:migrate
bun run db:seed
bun run dev
```

Web runs at `http://localhost:3000` and API at `http://localhost:3001`.

The seed creates a local workspace owner for development:

- email: `owner@twincam.local`
- password: `change-this-owner-password`

These credentials and `BETTER_AUTH_SECRET` are development defaults only. Replace
them before exposing any environment.

Organization invitations are persisted in `notification_outbox`. Connect that
outbox to the email provider selected by the new product; the starter deliberately
does not choose a vendor.

See `docs/architecture.md` for boundaries and `docs/commit-slices.md` for the
extraction history and extension strategy.
