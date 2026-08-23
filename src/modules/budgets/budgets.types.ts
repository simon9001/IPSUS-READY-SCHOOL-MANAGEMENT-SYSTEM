import type { budgets, budgetLines } from '../../db/schema/index.js'

export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type BudgetLine = typeof budgetLines.$inferSelect
export type NewBudgetLine = typeof budgetLines.$inferInsert

export interface BudgetVsActualRow {
  accountId: number
  accountCode: string
  accountName: string
  fundId: number
  fundCode: string
  budgeted: number
  actual: number
  variance: number
}
