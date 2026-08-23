import { journalRepository } from './journal.repository.js';
import { periodsRepository } from '../periods/periods.repository.js';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js';
function toAmount(value) {
    if (value === undefined)
        return 0;
    return typeof value === 'string' ? Number(value) : value;
}
function assertBalanced(lines) {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
        totalDebit += toAmount(line.debit);
        totalCredit += toAmount(line.credit);
    }
    if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
        throw new ValidationError(`Journal entry is not balanced: total debit ${totalDebit.toFixed(2)} != total credit ${totalCredit.toFixed(2)}`);
    }
}
async function assertPeriodOpen(periodId) {
    const period = await periodsRepository.findById(periodId);
    if (!period)
        throw new NotFoundError(`Fiscal period ${periodId} not found`);
    if (period.status === 'closed')
        throw new ConflictError(`Fiscal period ${periodId} is closed and cannot accept new postings`);
}
async function nextEntryNo(fiscalYear) {
    const count = await journalRepository.countEntriesForYear(fiscalYear);
    return `JE-${fiscalYear}-${String(count + 1).padStart(6, '0')}`;
}
async function insertEntry(input, status, extra) {
    assertBalanced(input.lines);
    await assertPeriodOpen(input.periodId);
    const fiscalYear = new Date(input.entryDate).getFullYear();
    const entryNo = await nextEntryNo(fiscalYear);
    return journalRepository.insertWithLines({
        entryNo,
        periodId: input.periodId,
        entryDate: input.entryDate,
        description: input.description,
        sourceModule: input.sourceModule,
        sourceReference: input.sourceReference,
        status,
        createdBy: input.createdBy,
        ...extra,
    }, input.lines.map((line) => ({
        accountId: line.accountId,
        fundId: line.fundId,
        debit: toAmount(line.debit).toFixed(2),
        credit: toAmount(line.credit).toFixed(2),
        description: line.description,
    })));
}
export const journalService = {
    list: () => journalRepository.findAll(),
    async getById(id) {
        const entry = await journalRepository.findById(id);
        if (!entry)
            throw new NotFoundError(`Journal entry ${id} not found`);
        const lines = await journalRepository.findLines(id);
        return { ...entry, lines };
    },
    /** Used by other modules (fees, payroll, procurement, assets, grants) whose
     *  own sub-process already carries its own approval — posts immediately. */
    postSystemEntry: (input) => insertEntry(input, 'posted', { postedBy: input.createdBy, postedAt: new Date() }),
    /** Manual/adjusting entries raised by the Bursar sit pending until a
     *  Principal or BOM Treasurer approves them (maker-checker). */
    createManualEntry: (input) => insertEntry(input, 'pending_approval', { submittedAt: new Date() }),
    async approve(id, approverId) {
        const entry = await journalRepository.findById(id);
        if (!entry)
            throw new NotFoundError(`Journal entry ${id} not found`);
        if (entry.status !== 'pending_approval')
            throw new ConflictError(`Entry is ${entry.status}, not pending approval`);
        await assertPeriodOpen(entry.periodId);
        return journalRepository.approve(id, approverId);
    },
    async reject(id, approverId, reason) {
        const entry = await journalRepository.findById(id);
        if (!entry)
            throw new NotFoundError(`Journal entry ${id} not found`);
        if (entry.status !== 'pending_approval')
            throw new ConflictError(`Entry is ${entry.status}, not pending approval`);
        return journalRepository.reject(id, approverId, reason);
    },
    async trialBalance(asOfDate, fundId) {
        const rows = await journalRepository.trialBalanceRows(asOfDate, fundId);
        let totalDebit = 0;
        let totalCredit = 0;
        const computed = rows.map((r) => {
            totalDebit += r.totalDebit;
            totalCredit += r.totalCredit;
            const balance = r.normalBalance === 'debit' ? r.totalDebit - r.totalCredit : r.totalCredit - r.totalDebit;
            return { ...r, balance };
        });
        return {
            asOfDate,
            fundId: fundId ?? null,
            rows: computed,
            totalDebit,
            totalCredit,
            isBalanced: Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
        };
    },
};
