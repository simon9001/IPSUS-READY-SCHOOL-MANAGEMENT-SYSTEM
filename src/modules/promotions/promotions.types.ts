import type { promotions } from '../../db/schema/index.js'

export type Promotion = typeof promotions.$inferSelect
export type NewPromotion = typeof promotions.$inferInsert
