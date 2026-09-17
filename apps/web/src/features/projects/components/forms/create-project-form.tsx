import { Button } from '@twincam/ui/components/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@twincam/ui/components/field'
import { Form } from '@twincam/ui/components/form'
import { Input } from '@twincam/ui/components/input'
import { Textarea } from '@twincam/ui/components/textarea'
import { FormProvider, useFormContext } from 'react-hook-form'

import type { CreateProjectFormInput } from '../../hooks/use-create-project-form'
import { useCreateProjectForm } from '../../hooks/use-create-project-form'

export function CreateProjectForm() {
  const { form, onSubmit } = useCreateProjectForm()

  return (
    <FormProvider {...form}>
      <CreateProjectFormFields onSubmit={onSubmit} />
    </FormProvider>
  )
}

interface CreateProjectFormFieldsProps {
  onSubmit: ReturnType<typeof useCreateProjectForm>['onSubmit']
}

/**
 * The presentational half: it validates by schema and delegates the submission.
 * The story mounts this one, with its own `FormProvider`, so the catalog never
 * needs a server.
 */
export function CreateProjectFormFields({ onSubmit }: Readonly<CreateProjectFormFieldsProps>) {
  const {
    formState: { errors, isSubmitting },
    register,
  } = useFormContext<CreateProjectFormInput>()

  return (
    <Form className='flex flex-col gap-4' noValidate onSubmit={onSubmit}>
      <Field invalid={Boolean(errors.name)} name='name'>
        <FieldLabel>Nome</FieldLabel>
        <Input {...register('name')} autoComplete='off' placeholder='Onboarding' type='text' />
        <FieldDescription>O nome é único dentro da organização.</FieldDescription>
        <FieldError>{errors.name?.message}</FieldError>
      </Field>

      <Field invalid={Boolean(errors.description)} name='description'>
        <FieldLabel>Descrição</FieldLabel>
        <Textarea
          {...register('description')}
          placeholder='O que este projeto entrega (opcional)'
          rows={3}
        />
        <FieldError>{errors.description?.message}</FieldError>
      </Field>

      <div className='grid'>
        <Button loading={isSubmitting} type='submit'>
          Criar projeto
        </Button>
      </div>
    </Form>
  )
}
