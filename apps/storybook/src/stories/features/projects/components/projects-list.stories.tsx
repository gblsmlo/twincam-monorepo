import { ProjectsList } from '@features/projects/components/projects-list'
import { projectsStoryFixtures } from '@features/projects/storybook/projects-story-fixtures'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { withFeatureSurface } from '../../../../test-utils/feature-story-surface'

const projects = projectsStoryFixtures.projects

const meta = {
  args: {
    canArchive: true,
    onArchive: fn(),
    projects,
  },
  component: ProjectsList,
  decorators: [withFeatureSurface],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Lista da fatia de referência. A data é formatada em UTC porque o HTML chega renderizado do servidor, e a ação de arquivar só aparece para quem o servidor deixaria arquivar.',
      },
    },
  },
  tags: ['autodocs', 'storybook-test'],
  title: 'Projects/ProjectsList',
} satisfies Meta<typeof ProjectsList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText('Onboarding')).toBeTruthy()
    // Archived rows keep their place in the table and lose the action.
    await expect(canvas.getAllByRole('button', { name: 'Arquivar' })).toHaveLength(2)
    await expect(canvas.getByText('14/09/2026')).toBeTruthy()
  },
}

export const WithoutPermission: Story = {
  args: { canArchive: false },
  parameters: {
    docs: {
      description: {
        story: 'Um membro não arquiva: a coluna de ações desaparece em vez de oferecer um 403.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText('Onboarding')).toBeTruthy()
    await expect(canvas.queryByRole('button', { name: 'Arquivar' })).toBeNull()
  },
}

export const ArchivingRow: Story = {
  args: { archivingProjectId: 'project-1' },
  parameters: {
    docs: { description: { story: 'Durante a escrita, só a linha em voo mostra o indicador.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first] = await canvas.findAllByRole('button', { name: 'Arquivar' })

    await expect(first?.dataset.loading).toBe('')
  },
}

export const ArchiveRequested: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A lista não navega nem escreve: ela reporta o projeto escolhido para a página.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const [first] = await within(canvasElement).findAllByRole('button', { name: 'Arquivar' })

    if (first) {
      await userEvent.click(first)
    }

    await expect(args.onArchive).toHaveBeenCalledWith(projects[0])
  },
}
