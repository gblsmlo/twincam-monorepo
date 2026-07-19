import { auth } from '@twincam/auth/server'
import { logEvent } from '@twincam/observability'
import { sql } from 'drizzle-orm'

import { db } from './client'

const ORGANIZATION_ID = 'seed_organization'
const USER_ID = 'seed_owner'
const OWNER_EMAIL = 'owner@twincam.local'
const OWNER_PASSWORD = 'change-this-owner-password'

const context = await auth.$context
const password = await context.password.hash(OWNER_PASSWORD)

await db.execute(sql`
  insert into organizations (id, name, slug, created_at)
  values (${ORGANIZATION_ID}, 'Twincam Demo', 'twincam-demo', now())
  on conflict (id) do update set name = excluded.name, slug = excluded.slug
`)

await db.execute(sql`
  insert into users (id, name, email, email_verified, created_at, updated_at)
  values (${USER_ID}, 'Demo Owner', ${OWNER_EMAIL}, true, now(), now())
  on conflict (id) do update
  set name = excluded.name, email = excluded.email, email_verified = true, updated_at = now()
`)

await db.execute(sql`
  insert into members (id, organization_id, user_id, role, created_at)
  values ('seed_owner_membership', ${ORGANIZATION_ID}, ${USER_ID}, 'owner', now())
  on conflict (organization_id, user_id) do update set role = excluded.role
`)

await db.execute(sql`
  insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
  values ('seed_owner_credential', ${USER_ID}, 'credential', ${USER_ID}, ${password}, now(), now())
  on conflict (id) do update set password = excluded.password, updated_at = now()
`)

logEvent({
  level: 'info',
  message: 'database.seed.completed',
  context: {
    organizationId: ORGANIZATION_ID,
    ownerEmail: OWNER_EMAIL,
  },
})
