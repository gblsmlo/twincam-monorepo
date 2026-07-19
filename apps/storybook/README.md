# Twincam Storybook

Storybook is the isolated review harness for Twincam UI. It renders the same
semantic tokens and Coss/Base UI primitives used by `apps/web`; it is not a
second design system or a source of product rules.

## Run locally

Use Bun 1.3.14 and Node 24.18.0, then run from the repository root:

```sh
bun run storybook
```

The local UI is served at `http://localhost:6006`.

Build the static review artifact with:

```sh
bun run storybook:build
```

Run the Storybook smoke runner against a local Storybook server with:

```sh
bun run storybook:test
```

The runner only executes stories tagged with `storybook-test`. Add that tag to
stable, deterministic stories when they are ready to become CI smoke coverage.

## Story ownership

Keep stories next to their owner:

- shared primitives and patterns: `packages/ui/src/**/*.stories.tsx`;
- product compositions and layouts: `apps/web/src/**/*.stories.tsx`;
- harness-only smoke checks: `apps/storybook/src/**/*.stories.tsx`.

Do not move production components into this app. The harness discovers their
co-located stories and imports `apps/web/src/styles/global.css` globally.

## Route-like and remote states

Stories must be deterministic and must not call the live API. Prefer a
presentational component receiving a typed fixture or view model for each
relevant state, such as `loading`, `empty`, `error`, `permission` and `ready`.

Keep fixtures beside the story or in a feature-local `fixtures` module when
several stories reuse them. Add provider decorators only for context that the
component actually requires. Introduce MSW only when a connected component
must prove request-level behavior that cannot be expressed through props.

Enable Autodocs per component with the `autodocs` tag; it is intentionally not
global so the catalog remains curated.
