import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function ok(c: Context, data: unknown, status: ContentfulStatusCode = 200) {
  return c.json({ success: true, data }, status)
}

export function created(c: Context, data: unknown) {
  return ok(c, data, 201)
}

export function noContent(c: Context) {
  return c.body(null, 204)
}
