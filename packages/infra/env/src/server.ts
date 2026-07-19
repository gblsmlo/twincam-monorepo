import { z } from 'zod'

import { type RuntimeEnv, readRuntimeEnv } from './runtime'

const originSchema = z
  .url()
  .refine(
    (value) => {
      const url = new URL(value)
      return url.pathname === '/' && url.search === '' && url.hash === ''
    },
    { message: 'Expected an origin without path, query, or hash.' },
  )
  .transform((value) => new URL(value).origin)

const csvOriginsSchema = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : value,
  z.array(originSchema).default([]),
)

export const serverEnvSchema = z.object({
  APP_NAME: z.string().min(1).default('Twincam'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().min(1),
  BETTER_AUTH_TRUSTED_ORIGINS: csvOriginsSchema,
  DATABASE_URL: z.string().min(1).startsWith('postgresql://'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  LEAD_SENSITIVE_DATA_KEY: z
    .string()
    .base64()
    .refine((value) => Buffer.from(value, 'base64').length === 32, {
      message: 'Expected a Base64-encoded 32-byte AES-256 key.',
    }),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const createServerEnv = (runtimeEnv: RuntimeEnv = readRuntimeEnv()) =>
  serverEnvSchema.parse(runtimeEnv)

export const serverEnv = createServerEnv()
export type ServerEnv = z.infer<typeof serverEnvSchema>
