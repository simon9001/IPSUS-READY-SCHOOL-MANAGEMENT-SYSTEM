/**
 * Postgres refuses to delete a row that other rows still reference through a
 * foreign key, raising SQLSTATE 23503. Every such key in this schema is
 * restrict-on-delete on purpose: a student with fee invoices, or a teacher on
 * the timetable, has history the school must keep. This reads that refusal and
 * returns the table holding the blocking rows, so a service can turn a raw
 * database error into a message a user can act on.
 *
 * drizzle wraps driver errors in DrizzleQueryError and keeps the original on
 * `.cause`, so the cause chain is checked, not just the outer error.
 */
const FOREIGN_KEY_VIOLATION = '23503'
const MAX_CAUSE_DEPTH = 3

interface PgErrorFields {
  code?: unknown
  table_name?: unknown
  detail?: unknown
  cause?: unknown
}

export function foreignKeyBlocker(err: unknown): string | null {
  let current: unknown = err
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current !== null && typeof current === 'object'; depth++) {
    const fields = current as PgErrorFields
    if (fields.code === FOREIGN_KEY_VIOLATION) {
      if (typeof fields.table_name === 'string' && fields.table_name) return fields.table_name
      const match = typeof fields.detail === 'string' ? fields.detail.match(/referenced from table "([^"]+)"/) : null
      return match ? match[1] : 'related_records'
    }
    current = fields.cause
  }
  return null
}

/** "fee_invoices" -> "fee invoices". */
export const humanizeTable = (table: string) => table.replace(/_/g, ' ')
