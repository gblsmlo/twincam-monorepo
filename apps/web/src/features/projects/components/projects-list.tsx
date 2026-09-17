import type { Project } from '@twincam/core/projects'
import { Badge } from '@twincam/ui/components/badge'
import { Button } from '@twincam/ui/components/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@twincam/ui/components/table'

interface ProjectsListProps {
  archivingProjectId?: string | null
  canArchive: boolean
  projects: readonly Project[]
  onArchive: (project: Project) => void
}

/**
 * Fixed to UTC on purpose: the server renders this HTML before the browser
 * does, and a formatter that follows the local zone would produce a different
 * day on each side and break hydration.
 */
const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
  year: 'numeric',
})

export function ProjectsList({
  archivingProjectId = null,
  canArchive,
  onArchive,
  projects,
}: Readonly<ProjectsListProps>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Projeto</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead>Criado em</TableHead>
          {canArchive ? <TableHead className='text-right'>Ações</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <span className='font-medium'>{project.name}</span>
              {project.description ? (
                <p className='text-muted-foreground text-sm'>{project.description}</p>
              ) : null}
            </TableCell>
            <TableCell>
              <Badge variant={project.status === 'archived' ? 'outline' : 'secondary'}>
                {project.status === 'archived' ? 'Arquivado' : 'Ativo'}
              </Badge>
            </TableCell>
            <TableCell>{dateFormat.format(new Date(project.createdAt))}</TableCell>
            {canArchive ? (
              <TableCell className='text-right'>
                {project.status === 'active' ? (
                  <Button
                    loading={archivingProjectId === project.id}
                    onClick={() => onArchive(project)}
                    size='sm'
                    variant='outline'
                  >
                    Arquivar
                  </Button>
                ) : null}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
