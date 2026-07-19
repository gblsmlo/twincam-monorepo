# Twincam Monorepo

[![CI](https://github.com/gblsmlo/twincam-monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/gblsmlo/twincam-monorepo/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/Bun-1.3.14-f9f1e1?logo=bun&logoColor=000)](https://bun.sh)
[![Node.js](https://img.shields.io/badge/Node.js-24.18.0-339933?logo=nodedotjs&logoColor=fff)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A production-minded, domain-neutral foundation for building tenant-aware SaaS
products without recreating the initial monorepo, authentication and
organization boilerplate.

Twincam provides the reusable platform layer. New products add their own
business capabilities as isolated vertical slices.

## What is included

- Email and password authentication
- Password recovery and reset
- Two-factor authentication
- Organizations and memberships
- Organization invitations with expiration
- Active-organization session context
- `owner`, `admin` and `member` organization roles
- Protected API actor resolution
- Organization onboarding and workspace switching
- Replaceable notification outbox
- Domain-neutral authenticated application shell
- Shared UI primitives and Storybook
- PostgreSQL migrations and development seed
- Docker images, Docker Compose and GitHub Actions CI

## What is intentionally not included

Twincam does not prescribe the business model of the SaaS built on top of it.
Billing, analytics, file storage, queues, product-specific roles, business
entities and email delivery providers are deliberately left out.

The notification outbox records authentication and invitation messages, but a
new product must connect it to its chosen delivery provider.

## Technology

| Layer | Technology |
| --- | --- |
| Runtime and package manager | Bun 1.3.14 |
| JavaScript toolchain | Node.js 24.18.0 LTS |
| Web | React 19, TanStack Start, TanStack Router, TanStack Query |
| Forms and validation | React Hook Form, Zod |
| API | Elysia |
| Authentication | Better Auth |
| Database | PostgreSQL 17, Drizzle ORM |
| UI | Base UI, Tailwind CSS, shared COSS primitives |
| Quality | TypeScript, Biome, Bun Test, Storybook |
| Operations | Docker Compose, GitHub Actions, structured logging |

## Architecture

```text
apps/web ───────────────┐
                       ├──> packages/core
apps/api ───────────────┤
   │                   │
   ├──> packages/auth  │
   └──> packages/infra ┘

packages/ui ──> apps/web
packages/observability ──> server-side workspaces
```

The dependency rules are intentionally strict:

- `packages/core` contains framework-independent contracts, failures and use cases.
- `apps/api` maps HTTP requests to Core and may bridge authentication and persistence.
- `apps/web` may consume public Core contracts, but never database schemas.
- Runtime packages expose explicit subpaths and avoid side effects in root barrels.
- UI primitives remain reusable and free from product-specific language.

Authentication identifies the user. The active organization and membership
determine which tenant the request may access. Protected API routes resolve all
three from server-controlled session state; client-provided role or ownership
claims are never treated as authorization evidence.

Read [the architecture guide](docs/architecture.md) before adding the first
business capability.

## Repository structure

```text
.
├── apps
│   ├── api                 # Elysia API and Better Auth HTTP adapter
│   ├── storybook           # Shared UI documentation
│   └── web                 # TanStack Start application
├── packages
│   ├── auth                # Authentication and organization policy
│   ├── core                # Public contracts and domain primitives
│   ├── infra
│   │   ├── database        # Drizzle schema, migrations and seed
│   │   └── env             # Typed environment validation
│   ├── observability       # Structured logging and audit events
│   └── ui                  # Domain-neutral UI primitives
├── docs                    # Architecture and delivery guidance
├── infra/docker            # Production image definitions
└── scripts                 # Toolchain and repository checks
```

## Requirements

- [Bun 1.3.14](https://bun.sh)
- [Node.js 24.18.0 LTS](https://nodejs.org)
- [Docker with Compose](https://docs.docker.com/compose/)

The required versions are recorded in `.bun-version`, `.node-version` and the
root `packageManager` field.

## Quick start

```bash
git clone git@github.com:gblsmlo/twincam-monorepo.git
cd twincam-monorepo

cp .env.example .env
bun install

docker compose up -d postgres
bun run db:migrate
bun run db:seed
bun run dev
```

The local services are available at:

| Service | URL |
| --- | --- |
| Web application | `http://localhost:3000` |
| API | `http://localhost:3001` |
| API health check | `http://localhost:3001/health` |

The development seed creates:

```text
Email:    owner@twincam.local
Password: change-this-owner-password
```

These credentials and the default `BETTER_AUTH_SECRET` are strictly for local
development. Replace them before exposing any environment.

## Environment configuration

Copy `.env.example` to `.env`. The main settings are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Application PostgreSQL connection |
| `DATABASE_MIGRATION_URL` | Migration PostgreSQL connection |
| `DATABASE_POOL_MAX` | Maximum database connections per process |
| `BETTER_AUTH_SECRET` | Session and authentication secret |
| `BETTER_AUTH_URL` | Public API origin used by Better Auth |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Explicit browser origins allowed by auth |
| `APP_URL` | Public web application origin |
| `APP_NAME` | Server-side application name |
| `VITE_APP_NAME` | Browser-visible application name |

Server variables are validated by `packages/infra/env`. Do not expose
server-only values through `VITE_*` variables.

## Common commands

| Command | Description |
| --- | --- |
| `bun run dev` | Start development workspaces |
| `bun run dev:web` | Start only the web application |
| `bun run dev:api` | Start only the API |
| `bun run storybook` | Start Storybook |
| `bun run db:generate` | Generate a Drizzle migration |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:seed` | Create local development data |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run lint:ci` | Check repository formatting and lint rules |
| `bun run typecheck` | Typecheck every workspace |
| `bun run test` | Run all workspace tests |
| `bun run build` | Build all buildable applications |
| `bun run storybook:build` | Build static Storybook documentation |

Run `sh scripts/check-toolchain.sh` before diagnosing local tool failures.

## Authentication and organization flow

1. A user creates an account or signs in.
2. A user without a membership is redirected to organization onboarding.
3. Creating an organization makes it the active workspace.
4. Owners and administrators may invite members.
5. An authenticated invitee accepts the invitation and joins the organization.
6. Users with multiple memberships may switch the active organization.
7. Protected API routes resolve user, organization and membership before
   executing tenant-scoped behavior.

Organization deletion is disabled by default. Owner-preservation hooks prevent
removing or demoting the last owner. Invitations require verified email
addresses and expire after 48 hours.

## Adding a business capability

Keep new product behavior out of the authentication and shared UI foundations:

1. Define public contracts in `packages/core/src/contracts`.
2. Add framework-independent rules and use cases to `packages/core`.
3. Persist tenant-owned data through `packages/infra/database`.
4. Add negative isolation tests using at least two organizations.
5. Expose the capability through a thin route module in `apps/api`.
6. Build its interface under `apps/web/src/features/<capability>`.
7. Promote only genuinely reusable, domain-neutral primitives to `packages/ui`.

Tenant-owned tables should carry an `organization_id` foreign key. Add and test
PostgreSQL row-level security with the first business table.

See [the delivery slices guide](docs/commit-slices.md) for a recommended commit
sequence.

## Validation

The CI pipeline runs against PostgreSQL 17 and executes:

```bash
sh scripts/check-toolchain.sh
bun install --frozen-lockfile
bun run db:migrate
bun run lint:ci
bun run typecheck
bun run test
bun run build
```

Changes to shared UI should also pass `bun run storybook:build`. Changes to
Dockerfiles or workspace dependencies should pass `docker compose build`.

## Production checklist

- Generate unique authentication and database secrets.
- Configure exact application URLs and trusted origins.
- Replace or disable local seed credentials.
- Connect and monitor the notification outbox.
- Add edge rate limiting and abuse protection.
- Configure PostgreSQL backups and migration rollback procedures.
- Add tenant-isolation tests for every business-owned table.
- Review observability fields to ensure secrets and personal data are not logged.

## Documentation

- [Architecture and extension rules](docs/architecture.md)
- [Commit slices and delivery strategy](docs/commit-slices.md)
- [Shared UI dependency policy](packages/ui/docs/DEPENDENCIES.md)
- [Shared UI update workflow](packages/ui/docs/UPDATE_WORKFLOW.md)

## License

Distributed under the [MIT License](LICENSE). Copyright © 2026 Gabriel Melo.
