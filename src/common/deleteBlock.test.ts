import { describe, it, expect } from 'vitest'
import { foreignKeyBlocker, humanizeTable } from './deleteBlock.js'

// Shaped like the real postgres.js error for a blocked delete, captured from
// the local database: SQLSTATE 23503 with TABLE NAME set to the referencing table.
const pgFkError = () =>
  Object.assign(new Error('update or delete on table "students" violates foreign key constraint "fee_invoices_student_id_students_id_fk" on table "fee_invoices"'), {
    code: '23503',
    table_name: 'fee_invoices',
    constraint_name: 'fee_invoices_student_id_students_id_fk',
    detail: 'Key (id)=(1) is still referenced from table "fee_invoices".',
  })

describe('foreignKeyBlocker', () => {
  it('returns the referencing table from a postgres foreign-key violation', () => {
    expect(foreignKeyBlocker(pgFkError())).toBe('fee_invoices')
  })

  it("unwraps drizzle's DrizzleQueryError, which keeps the driver error on .cause", () => {
    const wrapped = Object.assign(new Error('Failed query: delete from "students" ...'), { cause: pgFkError() })
    expect(foreignKeyBlocker(wrapped)).toBe('fee_invoices')
  })

  it('falls back to the detail text when table_name is absent', () => {
    const err = Object.assign(new Error('fk'), {
      code: '23503',
      detail: 'Key (id)=(1) is still referenced from table "timetable_entries".',
    })
    expect(foreignKeyBlocker(err)).toBe('timetable_entries')
  })

  it('still reports a block when Postgres names no table', () => {
    expect(foreignKeyBlocker(Object.assign(new Error('fk'), { code: '23503' }))).toBe('related_records')
  })

  it('ignores errors that are not foreign-key violations', () => {
    expect(foreignKeyBlocker(Object.assign(new Error('dup'), { code: '23505', table_name: 'students' }))).toBeNull()
    expect(foreignKeyBlocker(new Error('connection reset'))).toBeNull()
  })

  it('ignores values that are not errors at all', () => {
    expect(foreignKeyBlocker(undefined)).toBeNull()
    expect(foreignKeyBlocker('23503')).toBeNull()
  })
})

describe('humanizeTable', () => {
  it('turns a table name into words a user can read', () => {
    expect(humanizeTable('fee_invoices')).toBe('fee invoices')
    expect(humanizeTable('timetable_entries')).toBe('timetable entries')
  })
})
