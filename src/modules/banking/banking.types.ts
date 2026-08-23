import type { bankAccounts, bankReconciliations, bankReconciliationItems, imprestRequests, imprestRetirements } from '../../db/schema/index.js'

export type BankAccount = typeof bankAccounts.$inferSelect
export type NewBankAccount = typeof bankAccounts.$inferInsert
export type BankReconciliation = typeof bankReconciliations.$inferSelect
export type NewBankReconciliation = typeof bankReconciliations.$inferInsert
export type BankReconciliationItem = typeof bankReconciliationItems.$inferSelect
export type NewBankReconciliationItem = typeof bankReconciliationItems.$inferInsert
export type ImprestRequest = typeof imprestRequests.$inferSelect
export type NewImprestRequest = typeof imprestRequests.$inferInsert
export type ImprestRetirement = typeof imprestRetirements.$inferSelect
export type NewImprestRetirement = typeof imprestRetirements.$inferInsert
