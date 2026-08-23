import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { accounts, budgetLines, budgets, fiscalPeriods, funds, journalEntries, journalLines } from '../../db/schema/index.js'
import type { NewBudget, NewBudgetLine } from './budgets.types.js'

export const budgetsRepository = {
  findAll: () => db.select().from(budgets).orderBy(budgets.fiscalYear),

  findById: (id: number) =>
    db.select().from(budgets).where(eq(budgets.id, id)).then((rows) => rows[0]),

  findLines: (budgetId: number) =>
    db
      .select({
        line: budgetLines,
        accountCode: accounts.code,
        accountName: accounts.name,
        accountNormalBalance: accounts.normalBalance,
        fundCode: funds.code,
        periodStart: fiscalPeriods.startDate,
        periodEnd: fiscalPeriods.endDate,
      })
      .from(budgetLines)
      .innerJoin(accounts, eq(budgetLines.accountId, accounts.id))
      .innerJoin(funds, eq(budgetLines.fundId, funds.id))
      .leftJoin(fiscalPeriods, eq(budgetLines.periodId, fiscalPeriods.id))
      .where(eq(budgetLines.budgetId, budgetId)),

  async create(data: NewBudget, lines: Omit<NewBudgetLine, 'budgetId'>[]) {
    return db.transaction(async (tx) => {
      const [budget] = await tx.insert(budgets).values(data).returning()
      await tx.insert(budgetLines).values(lines.map((line) => ({ ...line, budgetId: budget.id })))
      return budget
    })
  },

  addLine: (budgetId: number, data: Omit<NewBudgetLine, 'budgetId'>) =>
    db.insert(budgetLines).values({ ...data, budgetId }).returning().then((rows) => rows[0]),

  approve: (id: number, approvedBy: number) =>
    db
      .update(budgets)
      .set({ status: 'approved', approvedBy, approvedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning()
      .then((rows) => rows[0]),

  async actualForScope(accountId: number, fundId: number, startDate: string, endDate: string) {
    const [row] = await db
      .select({
        totalDebit: sql<string>`coalesce(sum(${journalLines.debit}), 0)`,
        totalCredit: sql<string>`coalesce(sum(${journalLines.credit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
      .where(
        and(
          eq(journalLines.accountId, accountId),
          eq(journalLines.fundId, fundId),
          eq(journalEntries.status, 'posted'),
          gte(journalEntries.entryDate, startDate),
          lte(journalEntries.entryDate, endDate),
        ),
      )
    return { debit: Number(row?.totalDebit ?? 0), credit: Number(row?.totalCredit ?? 0) }
  },
}
