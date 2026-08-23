import { and, eq, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { accounts, journalEntries, journalLines } from '../../db/schema/index.js';
export const journalRepository = {
    findAll: () => db.select().from(journalEntries).orderBy(journalEntries.entryDate),
    findById: (id) => db.select().from(journalEntries).where(eq(journalEntries.id, id)).then((rows) => rows[0]),
    findLines: (journalEntryId) => db.select().from(journalLines).where(eq(journalLines.journalEntryId, journalEntryId)),
    async countEntriesForYear(fiscalYear) {
        const [{ count }] = await db
            .select({ count: sql `count(*)::int` })
            .from(journalEntries)
            .where(sql `entry_no like ${'JE-' + fiscalYear + '-%'}`);
        return count;
    },
    async insertWithLines(entry, lines) {
        return db.transaction(async (tx) => {
            const [inserted] = await tx.insert(journalEntries).values(entry).returning();
            await tx.insert(journalLines).values(lines.map((line, index) => ({ ...line, journalEntryId: inserted.id, lineNo: index + 1 })));
            return inserted;
        });
    },
    approve: (id, approverId) => db
        .update(journalEntries)
        .set({ status: 'posted', approvedBy: approverId, approvedAt: new Date(), postedBy: approverId, postedAt: new Date() })
        .where(eq(journalEntries.id, id))
        .returning()
        .then((rows) => rows[0]),
    reject: (id, approverId, reason) => db
        .update(journalEntries)
        .set({ status: 'rejected', approvedBy: approverId, approvedAt: new Date(), rejectionReason: reason })
        .where(eq(journalEntries.id, id))
        .returning()
        .then((rows) => rows[0]),
    async trialBalanceRows(asOfDate, fundId) {
        const conditions = [eq(journalEntries.status, 'posted'), lte(journalEntries.entryDate, asOfDate)];
        if (fundId !== undefined)
            conditions.push(eq(journalLines.fundId, fundId));
        const rows = await db
            .select({
            accountId: accounts.id,
            code: accounts.code,
            name: accounts.name,
            type: accounts.type,
            normalBalance: accounts.normalBalance,
            totalDebit: sql `coalesce(sum(${journalLines.debit}), 0)`,
            totalCredit: sql `coalesce(sum(${journalLines.credit}), 0)`,
        })
            .from(journalLines)
            .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
            .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
            .where(and(...conditions))
            .groupBy(accounts.id, accounts.code, accounts.name, accounts.type, accounts.normalBalance)
            .orderBy(accounts.code);
        return rows.map((r) => ({
            accountId: r.accountId,
            code: r.code,
            name: r.name,
            type: r.type,
            normalBalance: r.normalBalance,
            totalDebit: Number(r.totalDebit),
            totalCredit: Number(r.totalCredit),
            balance: 0, // computed by the service, which knows normal-balance sign rules
        }));
    },
};
