import { Button } from '@twincam/ui'
import { Field, FieldDescription, FieldError, FieldLabel } from '@twincam/ui/components/field'
import { Form } from '@twincam/ui/components/form'
import { Input } from '@twincam/ui/components/input'

import { useSignUpForm } from '../../hooks/use-sign-up-form'

interface SignUpFormProps {
  redirectTo: string
}

export function SignUpForm({ redirectTo }: Readonly<SignUpFormProps>) {
  const { form, onSubmit } = useSignUpForm({ redirectTo })
  const {
    formState: { errors, isSubmitting },
    register,
  } = form

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
        <Input
          {...register('password')}
          aria-invalid={Boolean(errors.password)}
          autoComplete='new-password'
          placeholder='Mínimo de 12 caracteres'
          type='password'
        />
        <FieldDescription>Combine letras, números e um símbolo.</FieldDescription>
        <FieldError>{errors.password?.message}</FieldError>
      </Field>

      <Field name='confirmPassword'>
        <FieldLabel>Confirmar senha</FieldLabel>
        <Input
          {...register('confirmPassword')}
          aria-invalid={Boolean(errors.confirmPassword)}
          autoComplete='new-password'
          placeholder='Repita a senha'
          type='password'
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
