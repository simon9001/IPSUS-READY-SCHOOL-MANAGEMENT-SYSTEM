import type { notices } from '../../db/schema/index.js'

export type Notice = typeof notices.$inferSelect
export type NewNotice = typeof notices.$inferInsert
