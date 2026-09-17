import type { Project } from '@twincam/core/projects'

/**
 * Sample data and server copy the stories display. It lives outside the
 * production tree and next to the feature, so a story never invents a message
 * or a shape the person would not see — and the catalog does not need to
 * depend on the contracts package to build a row.
 */
const project = (overrides: Partial<Project> = {}): Project => ({
  createdAt: '2026-09-14T10:00:00.000Z',
  description: null,
  id: 'project-1',
  name: 'Onboarding',
  status: 'active',
  updatedAt: '2026-09-14T10:00:00.000Z',
  ...overrides,
})

export const projectsStoryFixtures = {
  conflictMessage: 'Já existe um projeto com este nome nesta organização.',
  description: 'Primeira entrega do time de plataforma.',
  name: 'Onboarding',
  projects: [
    project({ description: 'Primeira entrega do time de plataforma.' }),
    project({ createdAt: '2026-09-02T09:30:00.000Z', id: 'project-2', name: 'Migração de dados' }),
    project({
      createdAt: '2026-08-21T14:15:00.000Z',
      id: 'project-3',
      name: 'Descoberta',
      status: 'archived',
    }),
  ],
  unreachableMessage: 'Não foi possível falar com o servidor. Tente novamente.',
} as const
