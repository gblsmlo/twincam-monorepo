import { getJestConfig } from '@storybook/test-runner'

const defaultConfig = getJestConfig()

export default {
  ...defaultConfig,
  modulePathIgnorePatterns: [
    ...(defaultConfig.modulePathIgnorePatterns ?? []),
    '<rootDir>/.claude/worktrees',
    '<rootDir>/apps/storybook/storybook-static',
  ],
  testPathIgnorePatterns: [
    ...(defaultConfig.testPathIgnorePatterns ?? []),
    '<rootDir>/.claude/worktrees',
    '<rootDir>/apps/storybook/storybook-static',
  ],
  watchPathIgnorePatterns: [
    ...(defaultConfig.watchPathIgnorePatterns ?? []),
    '<rootDir>/.claude/worktrees',
    '<rootDir>/apps/storybook/storybook-static',
  ],
}
