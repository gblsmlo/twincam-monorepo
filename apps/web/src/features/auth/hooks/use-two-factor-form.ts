import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toastManager } from '@twincam/ui/components/toast'
import { useForm } from 'react-hook-form'
import { verifyTotp } from '../http/two-factor'
import {
  type TwoFactorFormInput,
  type TwoFactorFormValues,
  twoFactorFormSchema,
} from '../schemas/two-factor-form'

export type { TwoFactorFormInput, TwoFactorFormValues } from '../schemas/two-factor-form'

interface UseTwoFactorFormParams {
  redirectTo: string
}

export function useTwoFactorForm({ redirectTo }: Readonly<UseTwoFactorFormParams>) {
  const navigate = useNavigate()
  const form = useForm<TwoFactorFormInput, unknown, TwoFactorFormValues>({
    defaultValues: {
      code: '',
    },
    mode: 'onSubmit',
    resolver: zodResolver(twoFactorFormSchema),
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await verifyTotp({
        code: values.code,
      })

      toastManager.add({
        description: 'Verificacao em duas etapas concluida.',
        title: 'Acesso validado',
        type: 'success',
      })

      await navigate({ to: redirectTo })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Codigo de autenticacao invalido.'

      toastManager.add({
        description: message,
        title: 'Falha na verificacao',
        type: 'error',
      })
    }
  })

  return {
    form,
    onSubmit,
  }
}
