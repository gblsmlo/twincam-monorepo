# Delivery slices

The extraction is organized as independently reviewable commits. This keeps the
starter usable after each slice and makes it possible to cherry-pick or audit a
specific architectural decision.

## Completed extraction

1. `7d354ae chore: bootstrap domain-neutral monorepo foundation`
   - toolchain, workspace manifests, shared UI, observability, environment
     validation, Dockerfiles and Storybook;
   - no authentication or product capability.
2. `bde46cf feat(auth): add tenant-aware identity foundation`
   - Better Auth, organizations, membership policy, PostgreSQL schema,
     migrations, seed, API auth handler and protected actor context.
3. `9eccc88 feat(web): add organization-aware SaaS shell`
   - login, signup, password recovery, 2FA, protected shell, organization
     onboarding, invitation acceptance, invitations and tenant switching.
4. `docs: document starter architecture and validation`
   - architecture rules, extension guide, CI and final validation evidence.

## Recommended slices for a new SaaS

Keep the first product capability in similarly narrow commits:

1. `docs(<capability>): define rules and acceptance scenarios`
2. `feat(core): add <capability> contracts and use cases`
3. `feat(database): persist tenant-owned <capability> data`
4. `feat(api): expose <capability> endpoints`
5. `feat(web): add <capability> user journey`
6. `test(<capability>): add cross-tenant and browser acceptance evidence`

Do not mix the first business domain into auth tables, session resolution or
generic UI primitives. If a slice cannot be reverted without breaking identity
or organization onboarding, its boundary should be reviewed before merging.
