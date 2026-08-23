import type { grantTypes, grantDisbursements } from '../../db/schema/index.js'

export type GrantType = typeof grantTypes.$inferSelect
export type NewGrantType = typeof grantTypes.$inferInsert
export type GrantDisbursement = typeof grantDisbursements.$inferSelect
export type NewGrantDisbursement = typeof grantDisbursements.$inferInsert
