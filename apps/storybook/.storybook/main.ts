import { execSync } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'

const storyFiles = '**/*.stories.@(js|jsx|mjs|ts|tsx)'

// Every consumer of `@libs/api-fetch` gets the browser stub: the real module
// reads the SSR request through `@tanstack/react-start`, which has no place in
// a story. The specific alias must come before the `@libs` prefix.
export const storybookAliases = [
  {
    find: '@libs/api-fetch',
    replacement: fileURLToPath(new URL('../src/api-fetch.ts', import.meta.url)),
  },
  { find: '@libs', replacement: fileURLToPath(new URL('../../web/src/libs', import.meta.url)) },
  {
    find: '@features',
    replacement: fileURLToPath(new URL('../../web/src/features', import.meta.url)),
  },
  { find: '@web', replacement: fileURLToPath(new URL('../../web/src', import.meta.url)) },
]

/**
 * The commit this catalog was built from.
 *
 * A published catalog with no version ages in silence: someone reads a
 * component three releases old and has no way to tell. `GITHUB_SHA` covers the
 * pipeline, `git` covers a local build, and a build with neither says `dev`
 * instead of claiming a commit it does not have.
 */
const buildCommit = (): string => {
  const fromPipeline = process.env.GITHUB_SHA

  if (fromPipeline) {
    return fromPipeline.slice(0, 7)
  }

  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'dev'
  }
}

const commit = buildCommit()

const config: StorybookConfig = {
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-vitest'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  // The Atomic ladder orders the catalog; `titlePrefix` per directory names
  // the group, and `storySort` in preview.ts decides the visual order.
  stories: [
    { directory: '../src/stories/ui', files: storyFiles, titlePrefix: 'UI' },
    { directory: '../src/stories/patterns', files: storyFiles, titlePrefix: 'Patterns' },
    { directory: '../src/stories/features', files: storyFiles, titlePrefix: 'Features' },
    { directory: '../src/stories/layouts', files: storyFiles, titlePrefix: 'Layout' },
    { directory: '../src/stories/pages', files: storyFiles, titlePrefix: 'Pages' },
  ],
  // The badge is appended to `body`, not to a Storybook element: the manager's
  // DOM is not a public interface, and a version stamp must not break when it
  // changes. The `meta` is the machine-readable half — a deploy check can read
  // which commit is live without scraping the page.
  managerHead: (head) => `${head}
    <meta name="twincam:commit" content="${commit}" />
    <style>
      #twincam-build {
        position: fixed; left: 10px; bottom: 8px; z-index: 10;
        font: 11px/1.4 ui-monospace, SFMono-Regular, monospace;
        color: #8b8b8b; pointer-events: none;
      }
    </style>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        const badge = document.createElement('div')
        badge.id = 'twincam-build'
        badge.textContent = ${JSON.stringify(commit)}
        document.body.appendChild(badge)
      })
    </script>`,
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: { alias: storybookAliases },
    }),
}

export default config

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
