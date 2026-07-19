import { Button } from '@twincam/ui'
import { Field, FieldDescription, FieldError, FieldLabel } from '@twincam/ui/components/field'
import { Form } from '@twincam/ui/components/form'
import { Input } from '@twincam/ui/components/input'
import { useRequestPasswordResetForm } from '../../hooks/use-request-password-reset-form'

interface ForgottenPasswordFormProps {
  initialEmail?: string
}

export function ForgottenPasswordForm({ initialEmail }: Readonly<ForgottenPasswordFormProps>) {
  const { form, onSubmit } = useRequestPasswordResetForm({ initialEmail })
  const {
    formState: { errors, isSubmitting },
    register,
  } = form

  return (
    <Form className='flex flex-col gap-5' noValidate onSubmit={onSubmit}>
      <Field name='email'>
        <FieldLabel>Email</FieldLabel>
        <Input
          {...register('email')}
          aria-invalid={Boolean(errors.email)}
          autoComplete='email'
          inputMode='email'
          placeholder='voce@empresa.com'
          type='email'
        />
        <FieldDescription>
          Enviaremos um link com token unico para redefinir a senha.
        </FieldDescription>
        <FieldError>{errors.email?.message}</FieldError>
      </Field>

      <div className='grid'>
        <Button loading={isSubmitting} type='submit'>
          Enviar link
        </Button>
      </div>
    </Form>
  )
}
