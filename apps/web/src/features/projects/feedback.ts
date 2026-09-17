export interface ProjectsFeedbackToast {
  description: string
  title: string
  type: 'error' | 'success'
}

const failure =
  (title: string) =>
  (description: string): ProjectsFeedbackToast => ({ description, title, type: 'error' })

/**
 * The toasts are the only evidence the person gets of a submission, and the
 * stories must show the same text the hooks emit. Both sides read this module.
 */
export const projectsFeedback = {
  archive: {
    failure: failure('Falha ao arquivar'),
    success: (name: string): ProjectsFeedbackToast => ({
      description: `${name} foi arquivado.`,
      title: 'Projeto arquivado',
      type: 'success',
    }),
  },
  create: {
    failure: failure('Falha ao criar projeto'),
    success: (name: string): ProjectsFeedbackToast => ({
      description: `${name} está pronto para receber trabalho.`,
      title: 'Projeto criado',
      type: 'success',
    }),
  },
} as const
