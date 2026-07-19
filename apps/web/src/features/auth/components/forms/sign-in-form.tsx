import { Link } from '@tanstack/react-router'
import { Button } from '@twincam/ui'
import { Field, FieldDescription, FieldError, FieldLabel } from '@twincam/ui/components/field'
import { Form } from '@twincam/ui/components/form'
import { Input } from '@twincam/ui/components/input'
import { FormProvider, useFormContext } from 'react-hook-form'

import type { SignInFormValues } from '../../hooks/use-sign-in-form'
import { useSignInForm } from '../../hooks/use-sign-in-form'
import { encodeAuthRedirect } from '../../utils/redirect'

interface SignInFormProps {
  initialEmail?: string
  redirectTo: string
}

export function SignInForm({ initialEmail, redirectTo }: Readonly<SignInFormProps>) {
  const { form, onSubmit } = useSignInForm({ initialEmail, redirectTo })

  return (
    <FormProvider {...form}>
      <SignInFields onSubmit={onSubmit} redirectTo={redirectTo} />
    </FormProvider>
  )
}

interface SignInFieldsProps {
  onSubmit: ReturnType<typeof useSignInForm>['onSubmit']
  redirectTo: string
}

function SignInFields({ onSubmit, redirectTo }: Readonly<SignInFieldsProps>) {
  const {
    formState: { errors, isSubmitting },
    register,
    watch,
  } = useFormContext<SignInFormValues>()
  const email = watch('email')

  return (
    <Form className='flex flex-col gap-5' noValidate onSubmit={onSubmit}>
      <Field name='email'>
        <FieldLabel>Email</FieldLabel>
        <Input
          {...register('email')}
          autoComplete='email'
          aria-invalid={Boolean(errors.email)}
          inputMode='email'
          placeholder='voce@empresa.com'
          type='email'
        />
        <FieldDescription>Use o e-mail da sua conta.</FieldDescription>
        <FieldError>{errors.email?.message}</FieldError>
      </Field>

      <Field name='password'>
        <FieldLabel>Senha</FieldLabel>
        <Input
          {...register('password')}
          autoComplete='current-password'
          aria-invalid={Boolean(errors.password)}
          placeholder='Sua senha'
          type='password'
        />
        <FieldError>{errors.password?.message}</FieldError>
      </Field>

      <div className='flex items-center justify-between gap-3 text-sm'>
        <Link
          className='text-cyan-200 transition-colors hover:text-cyan-100'
          search={{ email: email || undefined }}
          to='/forgotten-password'
        >
          Esqueci minha senha
        </Link>
        <Link
          className='text-slate-300 transition-colors hover:text-white'
          search={{ redirect: encodeAuthRedirect(redirectTo) }}
          to='/sign-up'
        >
          Criar conta
        </Link>
      </div>

      <div className='grid'>
        <Button loading={isSubmitting} type='submit'>
          Entrar
        </Button>
      </div>
    </Form>
  )
}
