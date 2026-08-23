import { zValidator as honoZValidator } from '@hono/zod-validator'
import type { ZodType } from 'zod'
import type { Context, ValidationTargets } from 'hono'

// Thin wrapper so every route gets the same error response shape on a
// failed validation, instead of each module reimplementing the hook.
export function zValidator<T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) {
  return honoZValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: 'Validation failed', issues: result.error.issues }, 400)
    }
  })
}

// Controllers live in a separate file from the route that attaches
// zValidator, so Hono's compile-time Env-based inference for c.req.valid()
// doesn't flow through. Validation itself already ran in the middleware;
// this just gives the already-validated payload the right static type.
export function getValidated<T>(c: Context, target: keyof ValidationTargets): T {
  return (c.req as unknown as { valid: (t: string) => T }).valid(target)
}
