import type { Meta, StoryObj } from '@storybook/react-vite'

function StorybookSmoke() {
  return (
    <main className='flex min-h-48 items-center justify-center bg-background text-foreground'>
      <div className='rounded-lg border bg-card px-4 py-3 shadow-xs/5'>
        <p className='font-medium text-sm'>Storybook harness ready</p>
      </div>
    </main>
  )
}

const meta = {
  component: StorybookSmoke,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  tags: ['storybook-test'],
  title: 'Harness/Smoke',
} satisfies Meta<typeof StorybookSmoke>

export default meta

type Story = StoryObj<typeof meta>

export const Ready: Story = {}
