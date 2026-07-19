import type { Meta, StoryObj } from '@storybook/react-vite'
import { MoreHorizontalIcon } from 'lucide-react'

import { Button } from './button'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
} from './card'

const meta = {
  argTypes: {
    className: { control: false },
    density: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    render: { control: false },
  },
  args: {
    density: 'md',
  },
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  title: 'Foundation/Card',
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Card className='w-96'>
      <CardHeader>
        <CardTitle>Proxima acao</CardTitle>
        <CardDescription>Lead prioritario para hoje.</CardDescription>
        <CardAction>
          <Button aria-label='Mais opcoes' size='icon-sm' variant='ghost'>
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardPanel>
        <p className='text-sm'>Agendar a reuniao de qualificacao com Marina Costa.</p>
      </CardPanel>
      <CardFooter className='justify-end gap-2'>
        <Button size='sm' variant='outline'>
          Adiar
        </Button>
        <Button size='sm'>Concluir</Button>
      </CardFooter>
    </Card>
  ),
}

export const Densities: Story = {
  render: () => (
    <div className='flex items-start gap-4'>
      {(['sm', 'md', 'lg'] as const).map((density) => (
        <Card className='w-72' density={density} key={density}>
          <CardHeader>
            <CardTitle>{density}</CardTitle>
            <CardDescription>
              Densidade com padding {density === 'sm' ? '4' : density === 'md' ? '6' : '8'}.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <p className='text-sm'>Conteúdo do card.</p>
          </CardPanel>
          <CardFooter>
            <Button size='sm'>Continuar</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
}

export const FramedSections: Story = {
  render: () => (
    <CardFrame className='w-96'>
      <CardFrameHeader>
        <CardFrameTitle>Resumo do lead</CardFrameTitle>
        <CardFrameDescription>Dados atualizados agora.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel>
          <dl className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <dt className='text-muted-foreground'>Etapa</dt>
              <dd>Qualificacao</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Prioridade</dt>
              <dd>Alta</dd>
            </div>
          </dl>
        </CardPanel>
      </Card>
      <CardFrameFooter className='flex justify-end'>
        <Button size='sm' variant='ghost'>
          Ver detalhes
        </Button>
      </CardFrameFooter>
    </CardFrame>
  ),
}
