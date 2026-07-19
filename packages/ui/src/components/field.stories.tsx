import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { Input } from './input'

const meta = {
  component: Field,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  title: 'Foundation/Field',
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

export const WithDescription: Story = {
  render: () => (
    <Field className='w-80' name='contact-name'>
      <FieldLabel htmlFor='field-contact-name'>Nome do contato</FieldLabel>
      <Input id='field-contact-name' placeholder='Como devemos chamar a pessoa?' />
      <FieldDescription>Este nome sera exibido na lista de leads.</FieldDescription>
    </Field>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Field className='w-80' disabled name='workspace-name'>
      <FieldLabel htmlFor='field-workspace-name'>Workspace</FieldLabel>
      <Input defaultValue='Operacoes comerciais' id='field-workspace-name' />
      <FieldDescription>O nome e gerenciado pela administracao.</FieldDescription>
    </Field>
  ),
}

export const Invalid: Story = {
  render: () => (
    <Field className='w-80' invalid name='contact-email'>
      <FieldLabel htmlFor='field-contact-email'>E-mail</FieldLabel>
      <Input aria-invalid defaultValue='contato@' id='field-contact-email' type='email' />
      <FieldError>Informe um e-mail valido.</FieldError>
    </Field>
  ),
}
