import { db } from '@twincam/infra-database/client'
import { sql } from 'drizzle-orm'

const startCommand = 'docker compose up -d postgres'
const migrateCommand = 'bun run db:migrate'

/**
 * Prerequisite of the integration layer. It fails naming the missing service so
 * an environmental blocker never reads like a regression, and a suite that
 * cannot run never reports green.
 */
export const requirePostgres = async (tables: readonly string[] = []): Promise<void> => {
  try {
    await db.execute(sql`select 1`)
  } catch (cause) {
    throw new Error(
      `Integration tests need PostgreSQL on DATABASE_URL. Start it with \`${startCommand}\`.`,
      { cause },
    )
  }

  for (const table of tables) {
    const rows = (await db.execute(
      sql`select to_regclass(${`public.${table}`}) is not null as present`,
    )) as Array<{ present: boolean }>

    if (!rows[0]?.present) {
      throw new Error(
        `Integration tests need the table "${table}". Apply the migrations with \`${migrateCommand}\`.`,
      )
    }
  }
}
