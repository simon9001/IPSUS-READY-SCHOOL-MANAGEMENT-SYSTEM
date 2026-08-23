import type { fiscalPeriods } from '../../db/schema/index.js'

export type FiscalPeriod = typeof fiscalPeriods.$inferSelect
export type NewFiscalPeriod = typeof fiscalPeriods.$inferInsert
