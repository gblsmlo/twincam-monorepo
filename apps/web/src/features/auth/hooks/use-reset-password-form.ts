import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toastManager } from '@twincam/ui/components/toast'
import { useForm } from 'react-hook-form'
import { resetPassword } from '../http/reset-password'
import {
  type ResetPasswordFormInput,
  type ResetPasswordFormValues,
  resetPasswordFormSchema,
} from '../schemas/reset-password-form'

export type {
  ResetPasswordFormInput,
  ResetPasswordFormValues,
} from '../schemas/reset-password-form'

interface UseResetPasswordFormParams {
  token: string
}

export function useResetPasswordForm({ token }: Readonly<UseResetPasswordFormParams>) {
  const navigate = useNavigate()
  const form = useForm<ResetPasswordFormInput, unknown, ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: '',
      newPassword: '',
    },
    resolver: zodResolver(resetPasswordFormSchema),
    mode: 'onSubmit',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await resetPassword({
        newPassword: values.newPassword,
        token,
      })

      toastManager.add({
        description: 'Sua senha foi atualizada. Entre com a nova credencial.',
        title: 'Senha atualizada',
        type: 'success',
      })

      await navigate({ to: '/login' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel redefinir a senha.'

      toastManager.add({
        description: message,
        title: 'Falha ao redefinir senha',
        type: 'error',
      })
    }
  })

  return {
    form,
    onSubmit,
  }
}
