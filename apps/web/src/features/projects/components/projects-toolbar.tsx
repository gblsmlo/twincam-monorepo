import { Button } from '@twincam/ui/components/button'
import { Input } from '@twincam/ui/components/input'
import type { FormEvent } from 'react'

interface ProjectsToolbarProps {
  defaultQuery?: string
  onSearch: (query: string) => void
}

/**
 * Knows no router: it reports what the person searched for and the page decides
 * that this belongs in the URL.
 */
export function ProjectsToolbar({ defaultQuery = '', onSearch }: Readonly<ProjectsToolbarProps>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = new FormData(event.currentTarget).get('q')

    onSearch(typeof query === 'string' ? query.trim() : '')
  }

  return (
    <search>
      <form className='flex items-center gap-2' onSubmit={handleSubmit}>
        <Input
          aria-label='Buscar projetos'
          className='max-w-xs'
          defaultValue={defaultQuery}
          name='q'
          placeholder='Buscar por nome'
          type='search'
        />
        <Button type='submit' variant='outline'>
          Buscar
        </Button>
      </form>
    </search>
  )
}
