import type { TestRunnerConfig } from '@storybook/test-runner'
import { getStoryContext } from '@storybook/test-runner'

const DEFAULT_VIEWPORT_SIZE = {
  height: 900,
  width: 1440,
}

const parseViewportSize = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

const config: TestRunnerConfig = {
  async preVisit(page, story) {
    const context = await getStoryContext(page, story)
    const viewportName = context.parameters.viewport?.defaultViewport
    const viewport = viewportName ? context.parameters.viewport?.options?.[viewportName] : null
    const width = parseViewportSize(viewport?.styles?.width)
    const height = parseViewportSize(viewport?.styles?.height)

    await page.setViewportSize({
      height: height ?? DEFAULT_VIEWPORT_SIZE.height,
      width: width ?? DEFAULT_VIEWPORT_SIZE.width,
    })
  },
  tags: {
    include: ['storybook-test'],
  },
}

export default config
