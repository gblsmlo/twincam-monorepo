import { Button } from '@twincam/ui'
import { Field, FieldDescription, FieldError, FieldLabel } from '@twincam/ui/components/field'
import { Form } from '@twincam/ui/components/form'
import { Input } from '@twincam/ui/components/input'
import { useResetPasswordForm } from '../../hooks/use-reset-password-form'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: Readonly<ResetPasswordFormProps>) {
  const { form, onSubmit } = useResetPasswordForm({ token })
  const {
    formState: { errors, isSubmitting },
    register,
  } = form

  return (
    <Form className='flex flex-col gap-5' noValidate onSubmit={onSubmit}>
      <Field name='newPassword'>
        <FieldLabel>Nova senha</FieldLabel>
        <Input
          {...register('newPassword')}
          aria-invalid={Boolean(errors.newPassword)}
          autoComplete='new-password'
          placeholder='Mínimo de 12 caracteres'
          type='password'
        />
        <FieldDescription>Use uma senha nova e diferente da anterior.</FieldDescription>
        <FieldError>{errors.newPassword?.message}</FieldError>
      </Field>

      <Field name='confirmPassword'>
        <FieldLabel>Confirmar senha</FieldLabel>
        <Input
          {...register('confirmPassword')}
          aria-invalid={Boolean(errors.confirmPassword)}
          autoComplete='new-password'
          placeholder='Repita a nova senha'
          type='password'
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </Field>

      <div className='grid'>
        <Button loading={isSubmitting} type='submit'>
          Atualizar senha
        </Button>
      </div>
    </Form>
  )
}
