import { expect, test } from '../helpers/app-test'

/**
 * The journey of the reference slice, and the only layer that proves the chain
 * whole: the browser writes through the typed client, the BFF route validates
 * and calls the use case, the workspace transaction applies the tenant context,
 * and the row comes back into the list. Everything below this proves one link.
 *
 * The seeded owner comes from `auth.setup.ts`; each test creates the record it
 * asserts on, so nothing depends on what an earlier run left behind.
 */

const uniqueName = (scenario: string) => `E2E ${scenario} ${crypto.randomUUID().slice(0, 8)}`

test.describe('@projects the reference vertical', () => {
  test('creates a project and shows it in the organization listing', async ({ page }) => {
    const name = uniqueName('criação')

    await page.goto('/projects')

    await expect(page.getByRole('heading', { name: 'Projetos' })).toBeVisible()

    await page.getByRole('textbox', { exact: true, name: 'Nome' }).fill(name)
    await page.getByRole('textbox', { name: 'Descrição' }).fill('Criado pela jornada E2E.')
    await page.getByRole('button', { name: 'Criar projeto' }).click()

    await expect(page.getByText('Projeto criado')).toBeVisible()
    await expect(page.getByRole('cell', { name, exact: false })).toBeVisible()
  })

  test('refuses a repeated name in the field that produced it', async ({ page }) => {
    const name = uniqueName('conflito')

    await page.goto('/projects')

    const nameField = page.getByRole('textbox', { exact: true, name: 'Nome' })

    await nameField.fill(name)
    await page.getByRole('button', { name: 'Criar projeto' }).click()
    await expect(page.getByRole('cell', { name, exact: false })).toBeVisible()

    await nameField.fill(name)
    await page.getByRole('button', { name: 'Criar projeto' }).click()

    // The 409 does not become a toast: it lands on the field the person can fix.
    await expect(page.getByText('Já existe um projeto com este nome')).toBeVisible()
  })

  test('archives a project and keeps the listing in step with the change', async ({ page }) => {
    const name = uniqueName('arquivo')

    await page.goto('/projects')

    await page.getByRole('textbox', { exact: true, name: 'Nome' }).fill(name)
    await page.getByRole('button', { name: 'Criar projeto' }).click()

    const row = page.getByRole('row').filter({ hasText: name })

    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Arquivar' }).click()

    await page.getByRole('button', { name: 'Arquivar', exact: true }).last().click()

    await expect(page.getByText('Projeto arquivado')).toBeVisible()
    await expect(row.getByText('Arquivado')).toBeVisible()
  })

  test('filters by name through the URL, so the search survives a reload', async ({ page }) => {
    const name = uniqueName('busca')
    const other = uniqueName('outro')

    await page.goto('/projects')

    for (const project of [name, other]) {
      await page.getByRole('textbox', { exact: true, name: 'Nome' }).fill(project)
      await page.getByRole('button', { name: 'Criar projeto' }).click()
      await expect(page.getByRole('cell', { name: project, exact: false })).toBeVisible()
    }

    await page.getByRole('searchbox', { name: 'Buscar projetos' }).fill(name)
    await page.getByRole('button', { name: 'Buscar' }).click()

    await expect(page).toHaveURL(/\?q=/)
    await expect(page.getByRole('cell', { name, exact: false })).toBeVisible()
    await expect(page.getByRole('cell', { name: other, exact: false })).toBeHidden()

    await page.reload()

    await expect(page.getByRole('cell', { name, exact: false })).toBeVisible()
    await expect(page.getByRole('cell', { name: other, exact: false })).toBeHidden()
  })
})
