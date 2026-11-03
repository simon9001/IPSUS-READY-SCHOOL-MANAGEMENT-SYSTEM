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

// Fields naming the user performing the action. The signed-in user is the only
// trustworthy source for these: taken from the request body, anyone holding the
// permission could approve or post in another person's name, which empties the
// maker-checker controls and the audit trail of meaning. Clients may still send
// them; the value is simply replaced.
//
// Deliberately absent: requestedBy on imprests (the cash holder, often not the
// clerk keying it in), and attendedBy/administeredBy on clinic records (the
// clinician, who may not be the one typing).
const ACTOR_FIELDS = new Set([
  'approvedBy',
  'approverId',
  'awardedBy',
  'createdBy',
  'decidedBy',
  'enteredBy',
  'generatedBy',
  'issuedBy',
  'openedBy',
  'paidBy',
  'processedBy',
  'publishedBy',
  'receivedBy',
  'reconciledBy',
  'recordedBy',
  'reinstatedBy',
  'submittedBy',
])

function stampActor<T>(value: T, actorId: number): T {
  if (Array.isArray(value)) return value.map((item) => stampActor(item, actorId)) as T
  if (value === null || typeof value !== 'object') return value
  const stamped = Object.entries(value).map(([key, field]) => [key, ACTOR_FIELDS.has(key) ? actorId : stampActor(field, actorId)])
  return Object.fromEntries(stamped) as T
}

// Controllers live in a separate file from the route that attaches
// zValidator, so Hono's compile-time Env-based inference for c.req.valid()
// doesn't flow through. Validation itself already ran in the middleware;
// this just gives the already-validated payload the right static type.
export function getValidated<T>(c: Context, target: keyof ValidationTargets): T {
  const value = (c.req as unknown as { valid: (t: string) => T }).valid(target)
  const user = c.get('user') as { id: number } | undefined
  return target === 'json' && user ? stampActor(value, user.id) : value
}
