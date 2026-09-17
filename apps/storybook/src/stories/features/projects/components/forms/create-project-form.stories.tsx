import { CreateProjectFormFields } from '@features/projects/components/forms/create-project-form'
import { projectsFeedback } from '@features/projects/feedback'
import type {
  CreateProjectFormInput,
  CreateProjectFormValues,
} from '@features/projects/hooks/use-create-project-form'
import { createProjectFormSchema } from '@features/projects/schemas/create-project-form'
import { projectsStoryFixtures } from '@features/projects/storybook/projects-story-fixtures'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { toastManager } from '@twincam/ui/components/toast'
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { withFeatureSurface } from '../../../../../test-utils/feature-story-surface'

type CreateProjectForm = UseFormReturn<CreateProjectFormInput, unknown, CreateProjectFormValues>
type CreateProjectSubmit = (form: CreateProjectForm) => Promise<void>

const createdToast = projectsFeedback.create.success(projectsStoryFixtures.name)
const unreachableToast = projectsFeedback.create.failure(projectsStoryFixtures.unreachableMessage)

const ignoreSubmit: CreateProjectSubmit = async () => undefined

const stayPending: CreateProjectSubmit = () => new Promise<void>(() => undefined)

const createProject: CreateProjectSubmit = async () => {
  toastManager.add(createdToast)
}

const failToReachServer: CreateProjectSubmit = async () => {
  toastManager.add(unreachableToast)
}

/**
 * The name conflict is the only server failure that goes back into the field
 * instead of the toast: the person fixes it where they typed it.
 */
const rejectDuplicatedName: CreateProjectSubmit = async (form) => {
  form.setError('name', { message: projectsStoryFixtures.conflictMessage, type: 'server' })
}

function CreateProjectFrame({ onSubmit }: Readonly<{ onSubmit: CreateProjectSubmit }>) {
  const form = useForm<CreateProjectFormInput, unknown, CreateProjectFormValues>({
    defaultValues: { description: '', name: '' },
    resolver: zodResolver(createProjectFormSchema),
  })

  return (
    <FormProvider {...form}>
      <CreateProjectFormFields onSubmit={form.handleSubmit(() => onSubmit(form))} />
    </FormProvider>
  )
}

async function fillProject(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)

  await userEvent.type(await canvas.findByLabelText('Nome'), projectsStoryFixtures.name)
  await userEvent.type(canvas.getByLabelText('Descrição'), projectsStoryFixtures.description)
  await userEvent.click(canvas.getByRole('button', { name: 'Criar projeto' }))
}

const meta = {
  args: {
    onSubmit: async () => undefined,
  },
  component: CreateProjectFormFields,
  decorators: [withFeatureSurface],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Criação de projeto na fatia de referência. O nome é único por organização: o conflito volta do servidor para o próprio campo, e as demais falhas viram toast.',
      },
    },
  },
  tags: ['autodocs', 'storybook-test'],
  title: 'Projects/CreateProject',
} satisfies Meta<typeof CreateProjectFormFields>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByLabelText('Nome')).toBeTruthy()
  },
  render: () => <CreateProjectFrame onSubmit={ignoreSubmit} />,
}

export const ValidationErrors: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Envio vazio: a mensagem vem do contrato do servidor, não de uma cópia na tela.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: 'Criar projeto' }))

    await expect(
      await canvas.findByText('Informe um nome com pelo menos 3 caracteres.'),
    ).toBeTruthy()
  },
  render: () => <CreateProjectFrame onSubmit={ignoreSubmit} />,
}

export const Submitting: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Com a criação em voo o botão assume o indicador e bloqueia o reenvio.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await fillProject(canvasElement)

    const submit = within(canvasElement).getByRole('button', { name: 'Criar projeto' })

    await waitFor(async () => {
      await expect(submit.dataset.loading).toBe('')
    })
  },
  render: () => <CreateProjectFrame onSubmit={stayPending} />,
}

export const NameAlreadyTaken: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Conflito no servidor: a mensagem volta para o campo de nome, não para o toast.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await fillProject(canvasElement)

    await expect(
      await within(canvasElement).findByText(projectsStoryFixtures.conflictMessage),
    ).toBeTruthy()
  },
  render: () => <CreateProjectFrame onSubmit={rejectDuplicatedName} />,
}

export const ProjectCreated: Story = {
  parameters: {
    docs: {
      description: { story: 'Sucesso: o toast repete o nome que a lista vai passar a mostrar.' },
    },
  },
  play: async ({ canvasElement }) => {
    await fillProject(canvasElement)

    const body = within(document.body)

    await expect(await body.findByText(createdToast.title)).toBeTruthy()
    await expect(await body.findByText(createdToast.description)).toBeTruthy()
  },
  render: () => <CreateProjectFrame onSubmit={createProject} />,
}

export const ServerUnreachable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Falha sem campo responsável: o erro vai para o toast e o formulário segue editável.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await fillProject(canvasElement)

    await expect(await within(document.body).findByText(unreachableToast.title)).toBeTruthy()
  },
  render: () => <CreateProjectFrame onSubmit={failToReachServer} />,
}
