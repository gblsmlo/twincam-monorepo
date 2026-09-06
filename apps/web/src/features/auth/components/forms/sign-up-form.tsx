import { PasswordStrength } from '@twincam/patterns/password-strength'
import { Button } from '@twincam/ui/components/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@twincam/ui/components/field'
import { Form } from '@twincam/ui/components/form'
import { Input } from '@twincam/ui/components/input'

import { PasswordField } from '../../../../components/password-field'
import { useSignUpForm } from '../../hooks/use-sign-up-form'
import { passwordRequirements } from '../../password-requirements'

interface SignUpFormProps {
  redirectTo: string
}

export function SignUpForm({ redirectTo }: Readonly<SignUpFormProps>) {
  const { form, onSubmit } = useSignUpForm({ redirectTo })
  const {
    formState: { errors, isSubmitting },
    register,
    watch,
  } = form
  const password = watch('password') ?? ''

  return (
    <Form className='flex flex-col gap-5' noValidate onSubmit={onSubmit}>
      <Field name='name'>
        <FieldLabel>Nome</FieldLabel>
        <Input
          {...register('name')}
          aria-invalid={Boolean(errors.name)}
          autoComplete='name'
          placeholder='Seu nome'
          type='text'
        />
        <FieldError>{errors.name?.message}</FieldError>
      </Field>

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
        <FieldDescription>Usaremos este e-mail para verificação e acesso.</FieldDescription>
        <FieldError>{errors.email?.message}</FieldError>
      </Field>

      <Field name='password'>
        <FieldLabel>Senha</FieldLabel>
        <PasswordField
          {...register('password')}
          aria-invalid={Boolean(errors.password)}
          autoComplete='new-password'
          placeholder='Mínimo de 12 caracteres'
        />
        <PasswordStrength
          ariaLabel='Força da senha'
          requirements={passwordRequirements(password)}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </Field>

      <Field name='confirmPassword'>
        <FieldLabel>Confirmar senha</FieldLabel>
        <PasswordField
          {...register('confirmPassword')}
          aria-invalid={Boolean(errors.confirmPassword)}
          autoComplete='new-password'
          placeholder='Repita a senha'
          toggleLabel='confirmação'
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </Field>

      <div className='grid'>
        <Button loading={isSubmitting} type='submit'>
          Criar conta
        </Button>
      </div>
    </Form>
  )
}
