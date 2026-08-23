import type { accounts } from '../../db/schema/index.js'

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
