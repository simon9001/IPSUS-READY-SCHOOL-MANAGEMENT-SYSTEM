import type { journalEntries, journalLines } from '../../db/schema/index.js'

export type JournalEntry = typeof journalEntries.$inferSelect
export type NewJournalEntry = typeof journalEntries.$inferInsert
export type JournalLine = typeof journalLines.$inferSelect
export type NewJournalLine = typeof journalLines.$inferInsert

export interface TrialBalanceRow {
  accountId: number
  code: string
  name: string
  type: string
  normalBalance: string
  totalDebit: number
  totalCredit: number
  balance: number
}

export interface TrialBalanceResult {
  asOfDate: string
  fundId: number | null
  rows: TrialBalanceRow[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
}
