import type { Project } from '@twincam/core/projects'
import { ConfirmDialog } from '@twincam/patterns/confirm-dialog'

interface ArchiveProjectDialogProps {
  isArchiving: boolean
  project: Project | null
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

/**
 * The shell is the neutral pattern; this only knows which project is at stake
 * and what the copy says. Archiving is reversible in the data model, so it is a
 * confirmation and not the destructive dialog.
 */
export function ArchiveProjectDialog({
  isArchiving,
  onConfirm,
  onOpenChange,
  project,
}: Readonly<ArchiveProjectDialogProps>) {
  return (
    <ConfirmDialog
      confirmLabel='Arquivar'
      confirmingLabel='Arquivando'
      description={`${project?.name ?? 'O projeto'} sai da lista ativa e deixa de receber trabalho.`}
      isConfirming={isArchiving}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={project !== null}
      title='Arquivar projeto'
    />
  )
}
