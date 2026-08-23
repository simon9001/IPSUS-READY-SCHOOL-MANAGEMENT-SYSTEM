import { zValidator as honoZValidator } from '@hono/zod-validator';
// Thin wrapper so every route gets the same error response shape on a
// failed validation, instead of each module reimplementing the hook.
export function zValidator(target, schema) {
    return honoZValidator(target, schema, (result, c) => {
        if (!result.success) {
            return c.json({ success: false, error: 'Validation failed', issues: result.error.issues }, 400);
        }
    });
}
// Controllers live in a separate file from the route that attaches
// zValidator, so Hono's compile-time Env-based inference for c.req.valid()
// doesn't flow through. Validation itself already ran in the middleware;
// this just gives the already-validated payload the right static type.
export function getValidated(c, target) {
    return c.req.valid(target);
}
