import type { funds } from '../../db/schema/index.js'

export type Fund = typeof funds.$inferSelect
export type NewFund = typeof funds.$inferInsert
