import { Link } from '@tanstack/react-router'
import { Button } from '@twincam/ui'
import { Field, FieldDescription, FieldError, FieldLabel } from '@twincam/ui/components/field'
import { Form } from '@twincam/ui/components/form'
import { Input } from '@twincam/ui/components/input'
import { FormProvider, useFormContext } from 'react-hook-form'

import { Page } from '../../../components/page'
import type { TwoFactorFormValues } from '../hooks/use-two-factor-form'
import { useTwoFactorForm } from '../hooks/use-two-factor-form'

interface TwoFactorPageProps {
  redirectTo: string
}

export function TwoFactorPage({ redirectTo }: Readonly<TwoFactorPageProps>) {
  const { form, onSubmit } = useTwoFactorForm({ redirectTo })

  return (
    <Page>
      <Page.Header
        description='Informe o código do seu aplicativo autenticador para continuar.'
        title='Verificação em duas etapas'
      />
      <Page.Body>
        <FormProvider {...form}>
          <TwoFactorFields onSubmit={onSubmit} />
        </FormProvider>
      </Page.Body>
      <Page.Footer>
        <p className='text-muted-foreground text-sm'>
          Errou o fluxo? <Link to='/login'>Voltar ao login</Link>
        </p>
      </Page.Footer>
    </Page>
  )
}

interface TwoFactorFieldsProps {
  onSubmit: ReturnType<typeof useTwoFactorForm>['onSubmit']
}

function TwoFactorFields({ onSubmit }: Readonly<TwoFactorFieldsProps>) {
  const {
    formState: { errors, isSubmitting },
    register,
  } = useFormContext<TwoFactorFormValues>()

  return (
    <Form className='flex flex-col gap-5' noValidate onSubmit={onSubmit}>
      <p className='text-muted-foreground text-sm'>
        Informe o codigo temporario do seu aplicativo autenticador para continuar.
      </p>

      <Field name='code'>
        <FieldLabel>Codigo TOTP</FieldLabel>
        <Input
          {...register('code', {
            setValueAs: (value) => (typeof value === 'string' ? value.trim() : value),
          })}
          aria-invalid={Boolean(errors.code)}
          autoComplete='one-time-code'
          inputMode='numeric'
          maxLength={8}
          minLength={6}
          placeholder='000000'
          type='text'
        />
        <FieldDescription>Use o codigo do aplicativo autenticador.</FieldDescription>
        <FieldError>{errors.code?.message}</FieldError>
      </Field>

      <div className='grid'>
        <Button loading={isSubmitting} type='submit'>
          Verificar codigo
        </Button>
      </div>
    </Form>
  )
}
