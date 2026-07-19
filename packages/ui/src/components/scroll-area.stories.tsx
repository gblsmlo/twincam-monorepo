import type { Meta, StoryObj } from '@storybook/react-vite'

import { ScrollArea } from './scroll-area'

const activities = [
  'Contato criado a partir do formulario do site.',
  'Marina Costa assumiu a responsabilidade pelo lead.',
  'Prioridade alterada para alta.',
  'Tarefa de qualificacao agendada para hoje.',
  'Nota adicionada com o contexto da primeira conversa.',
  'Lead movido para a etapa de proposta.',
  'Documento comercial anexado ao registro.',
  'Reuniao de retorno confirmada para sexta-feira.',
]

const meta = {
  component: ScrollArea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  title: 'Foundation/ScrollArea',
} satisfies Meta<typeof ScrollArea>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <ScrollArea className='h-64 w-96 rounded-lg border p-3'>
      <ol className='space-y-3'>
        {activities.map((activity, index) => (
          <li className='border-b pb-3 text-sm last:border-0' key={activity}>
            <span className='me-2 text-muted-foreground'>{index + 1}.</span>
            {activity}
          </li>
        ))}
      </ol>
    </ScrollArea>
  ),
}

export const WithFadeAndGutter: Story = {
  render: () => (
    <ScrollArea className='h-64 w-96 rounded-lg border p-3' scrollFade scrollbarGutter>
      <ol className='space-y-3'>
        {activities.map((activity, index) => (
          <li className='border-b pb-3 text-sm last:border-0' key={activity}>
            <span className='me-2 text-muted-foreground'>{index + 1}.</span>
            {activity}
          </li>
        ))}
      </ol>
    </ScrollArea>
  ),
}
