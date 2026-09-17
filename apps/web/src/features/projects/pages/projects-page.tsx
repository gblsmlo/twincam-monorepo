import { useInfiniteQuery } from '@tanstack/react-query'
import type { Project } from '@twincam/core/projects'
import { StateSurface } from '@twincam/patterns/state-surface'
import { Button } from '@twincam/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@twincam/ui/components/card'
import { Skeleton } from '@twincam/ui/components/skeleton'
import { useState } from 'react'

import { Page } from '../../../components/page'
import { ArchiveProjectDialog } from '../components/dialogs/archive-project-dialog'
import { CreateProjectForm } from '../components/forms/create-project-form'
import { ProjectsList } from '../components/projects-list'
import { ProjectsToolbar } from '../components/projects-toolbar'
import { useArchiveProject } from '../hooks/use-archive-project'
import { projectsQueryOptions } from '../query-options'

interface ProjectsPageProps {
  canArchive: boolean
  query?: string
  onQueryChange: (query: string | undefined) => void
}

export function ProjectsPage({ canArchive, onQueryChange, query }: Readonly<ProjectsPageProps>) {
  const projects = useInfiniteQuery(projectsQueryOptions({ q: query }))
  const archive = useArchiveProject()
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null)

  const items = projects.data?.pages.flatMap((page) => page.items) ?? []

  const confirmArchive = () => {
    if (!projectToArchive) return

    archive.mutate(projectToArchive, {
      onSettled: () => setProjectToArchive(null),
    })
  }

  return (
    <Page className='mx-auto w-full max-w-5xl p-6'>
      <Page.Header
        actions={
          <ProjectsToolbar
            defaultQuery={query}
            onSearch={(next) => onQueryChange(next || undefined)}
          />
        }
        description='A fatia de referência desta base: contrato no Core, tabela isolada por organização, rota fina e esta tela.'
        title='Projetos'
      />

      <Page.Body>
        <Card>
          <CardHeader>
            <CardTitle>Novo projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateProjectForm />
          </CardContent>
        </Card>

        {projects.isPending ? (
          <div className='space-y-2' data-slot='projects-loading'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : null}

        {projects.isError ? (
          <StateSurface
            actions={[{ label: 'Tentar de novo', onPress: () => void projects.refetch() }]}
            description='A lista não pôde ser carregada. Verifique a conexão e tente de novo.'
            kind='error'
            title='Falha ao carregar projetos'
          />
        ) : null}

        {projects.isSuccess && items.length === 0 ? (
          <StateSurface
            description={
              query
                ? `Nenhum projeto com "${query}" no nome.`
                : 'Crie o primeiro projeto para ver a lista aqui.'
            }
            kind={query ? 'no-result' : 'empty'}
            title={query ? 'Nada encontrado' : 'Ainda sem projetos'}
          />
        ) : null}

        {items.length > 0 ? (
          <ProjectsList
            archivingProjectId={archive.isPending ? projectToArchive?.id : null}
            canArchive={canArchive}
            onArchive={setProjectToArchive}
            projects={items}
          />
        ) : null}

        {projects.hasNextPage ? (
          <div className='flex justify-center'>
            <Button
              loading={projects.isFetchingNextPage}
              onClick={() => void projects.fetchNextPage()}
              variant='outline'
            >
              Carregar mais
            </Button>
          </div>
        ) : null}
      </Page.Body>

      <ArchiveProjectDialog
        isArchiving={archive.isPending}
        onConfirm={confirmArchive}
        onOpenChange={(open) => {
          if (!open) setProjectToArchive(null)
        }}
        project={projectToArchive}
      />
    </Page>
  )
}
