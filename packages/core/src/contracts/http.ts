import { z } from 'zod'

/**
 * The envelope every expected failure crosses the boundary in. The `code` is
 * the contract a client routes on; the `message` is diagnostic and may change.
 * It lives here so the API declares its responses and the web reads them from
 * one declaration instead of two that agree until they do not.
 */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>
