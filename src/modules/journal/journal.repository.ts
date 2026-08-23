import { and, eq, lte, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { accounts, journalEntries, journalLines } from '../../db/schema/index.js'
import type { NewJournalEntry, NewJournalLine, TrialBalanceRow } from './journal.types.js'

export const journalRepository = {
  findAll: () => db.select().from(journalEntries).orderBy(journalEntries.entryDate),

  findById: (id: number) =>
    db.select().from(journalEntries).where(eq(journalEntries.id, id)).then((rows) => rows[0]),

  findLines: (journalEntryId: number) =>
    db.select().from(journalLines).where(eq(journalLines.journalEntryId, journalEntryId)),

  async countEntriesForYear(fiscalYear: number) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(journalEntries)
      .where(sql`entry_no like ${'JE-' + fiscalYear + '-%'}`)
    return count
  },

  async insertWithLines(entry: NewJournalEntry, lines: Omit<NewJournalLine, 'journalEntryId' | 'lineNo'>[]) {
    return db.transaction(async (tx) => {
      const [inserted] = await tx.insert(journalEntries).values(entry).returning()
      await tx.insert(journalLines).values(
        lines.map((line, index) => ({ ...line, journalEntryId: inserted.id, lineNo: index + 1 })),
      )
      return inserted
    })
  },

  approve: (id: number, approverId: number) =>
    db
      .update(journalEntries)
      .set({ status: 'posted', approvedBy: approverId, approvedAt: new Date(), postedBy: approverId, postedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning()
      .then((rows) => rows[0]),

  reject: (id: number, approverId: number, reason: string) =>
    db
      .update(journalEntries)
      .set({ status: 'rejected', approvedBy: approverId, approvedAt: new Date(), rejectionReason: reason })
      .where(eq(journalEntries.id, id))
      .returning()
      .then((rows) => rows[0]),

  async trialBalanceRows(asOfDate: string, fundId?: number): Promise<TrialBalanceRow[]> {
    const conditions = [eq(journalEntries.status, 'posted'), lte(journalEntries.entryDate, asOfDate)]
    if (fundId !== undefined) conditions.push(eq(journalLines.fundId, fundId))

    const rows = await db
      .select({
        accountId: accounts.id,
        code: accounts.code,
        name: accounts.name,
        type: accounts.type,
        normalBalance: accounts.normalBalance,
        totalDebit: sql<string>`coalesce(sum(${journalLines.debit}), 0)`,
        totalCredit: sql<string>`coalesce(sum(${journalLines.credit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .where(and(...conditions))
      .groupBy(accounts.id, accounts.code, accounts.name, accounts.type, accounts.normalBalance)
      .orderBy(accounts.code)

    return rows.map((r) => ({
      accountId: r.accountId,
      code: r.code,
      name: r.name,
      type: r.type,
      normalBalance: r.normalBalance,
      totalDebit: Number(r.totalDebit),
      totalCredit: Number(r.totalCredit),
      balance: 0, // computed by the service, which knows normal-balance sign rules
    }))
  },
}
