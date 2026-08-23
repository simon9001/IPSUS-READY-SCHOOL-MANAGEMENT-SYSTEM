import { and, eq, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { accounts, fiscalPeriods, journalEntries, journalLines } from '../../db/schema/index.js';
export class UnbalancedEntryError extends Error {
    constructor(totalDebit, totalCredit) {
        super(`Journal entry is not balanced: total debit ${totalDebit} != total credit ${totalCredit}`);
        this.name = 'UnbalancedEntryError';
    }
}
export class PeriodClosedError extends Error {
    constructor(periodId) {
        super(`Fiscal period ${periodId} is closed and cannot accept new postings`);
        this.name = 'PeriodClosedError';
    }
}
function toAmount(value) {
    if (value === undefined)
        return 0;
    return typeof value === 'string' ? Number(value) : value;
}
function assertBalanced(lines) {
    if (lines.length < 2) {
        throw new Error('A journal entry requires at least two lines');
    }
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
        totalDebit += toAmount(line.debit);
        totalCredit += toAmount(line.credit);
    }
    if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
        throw new UnbalancedEntryError(totalDebit.toFixed(2), totalCredit.toFixed(2));
    }
}
async function assertPeriodOpen(periodId) {
    const [period] = await db.select().from(fiscalPeriods).where(eq(fiscalPeriods.id, periodId));
    if (!period || period.status === 'closed') {
        throw new PeriodClosedError(periodId);
    }
}
async function nextEntryNo(fiscalYear) {
    const [{ count }] = await db
        .select({ count: sql `count(*)::int` })
        .from(journalEntries)
        .where(sql `entry_no like ${'JE-' + fiscalYear + '-%'}`);
    const seq = count + 1;
    return `JE-${fiscalYear}-${String(seq).padStart(6, '0')}`;
}
async function insertEntryWithLines(input, status, extra) {
    assertBalanced(input.lines);
    await assertPeriodOpen(input.periodId);
    const fiscalYear = new Date(input.entryDate).getFullYear();
    return db.transaction(async (tx) => {
        const entryNo = await nextEntryNo(fiscalYear);
        const [entry] = await tx
            .insert(journalEntries)
            .values({
            entryNo,
            periodId: input.periodId,
            entryDate: input.entryDate,
            description: input.description,
            sourceModule: input.sourceModule,
            sourceReference: input.sourceReference,
            status,
            createdBy: input.createdBy,
            ...extra,
        })
            .returning();
        await tx.insert(journalLines).values(input.lines.map((line, index) => ({
            journalEntryId: entry.id,
            lineNo: index + 1,
            accountId: line.accountId,
            fundId: line.fundId,
            debit: toAmount(line.debit).toFixed(2),
            credit: toAmount(line.credit).toFixed(2),
            description: line.description,
        })));
        return entry;
    });
}
/**
 * Used by other modules (fees, payroll, procurement, assets, capitation) to
 * book their financial impact directly as posted, since those sub-processes
 * already carry their own approval workflow (e.g. an approved payroll run).
 */
export async function postSystemJournalEntry(input) {
    return insertEntryWithLines(input, 'posted', {
        postedBy: input.createdBy,
        postedAt: new Date(),
    });
}
/**
 * Used for manual/adjusting journal entries raised by the Bursar. These sit
 * as pending_approval until a Principal or BOM Treasurer approves them via
 * approveJournalEntry — enforcing maker-checker segregation of duties.
 */
export async function createManualJournalEntry(input) {
    return insertEntryWithLines(input, 'pending_approval', {
        submittedAt: new Date(),
    });
}
export async function approveJournalEntry(entryId, approverId) {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, entryId));
    if (!entry)
        throw new Error('Journal entry not found');
    if (entry.status !== 'pending_approval')
        throw new Error(`Entry is ${entry.status}, not pending approval`);
    await assertPeriodOpen(entry.periodId);
    const [updated] = await db
        .update(journalEntries)
        .set({ status: 'posted', approvedBy: approverId, approvedAt: new Date(), postedBy: approverId, postedAt: new Date() })
        .where(eq(journalEntries.id, entryId))
        .returning();
    return updated;
}
export async function rejectJournalEntry(entryId, approverId, reason) {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, entryId));
    if (!entry)
        throw new Error('Journal entry not found');
    if (entry.status !== 'pending_approval')
        throw new Error(`Entry is ${entry.status}, not pending approval`);
    const [updated] = await db
        .update(journalEntries)
        .set({ status: 'rejected', approvedBy: approverId, approvedAt: new Date(), rejectionReason: reason })
        .where(eq(journalEntries.id, entryId))
        .returning();
    return updated;
}
/**
 * The Trial Balance: every account's cumulative debit/credit balance as of
 * a given date, drawn only from posted journal lines. Optionally scoped to
 * a single fund (votehead) to check e.g. the Capitation fund in isolation.
 */
export async function getTrialBalance(params) {
    const conditions = [eq(journalEntries.status, 'posted'), lte(journalEntries.entryDate, params.asOfDate)];
    if (params.fundId !== undefined) {
        conditions.push(eq(journalLines.fundId, params.fundId));
    }
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
    let totalDebit = 0;
    let totalCredit = 0;
    const resultRows = rows.map((r) => {
        const debit = Number(r.totalDebit);
        const credit = Number(r.totalCredit);
        totalDebit += debit;
        totalCredit += credit;
        const balance = r.normalBalance === 'debit' ? debit - credit : credit - debit;
        return {
            accountId: r.accountId,
            code: r.code,
            name: r.name,
            type: r.type,
            normalBalance: r.normalBalance,
            totalDebit: debit,
            totalCredit: credit,
            balance,
        };
    });
    return {
        asOfDate: params.asOfDate,
        fundId: params.fundId ?? null,
        rows: resultRows,
        totalDebit,
        totalCredit,
        isBalanced: Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
    };
}
