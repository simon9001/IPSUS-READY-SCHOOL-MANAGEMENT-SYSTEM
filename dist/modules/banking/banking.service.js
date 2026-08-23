import { bankingRepository } from './banking.repository.js';
import { journalService } from '../journal/journal.service.js';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js';
export const bankingService = {
    listAccounts: () => bankingRepository.findAllAccounts(),
    async getAccountById(id) {
        const account = await bankingRepository.findAccountById(id);
        if (!account)
            throw new NotFoundError(`Bank account ${id} not found`);
        return account;
    },
    createAccount: (input) => bankingRepository.createAccount(input),
    listReconciliations: (bankAccountId) => bankingRepository.findReconciliationsByAccount(bankAccountId),
    createReconciliation: (input) => {
        const { items, ...reconciliation } = input;
        return bankingRepository.createReconciliation({ ...reconciliation, statementBalance: String(reconciliation.statementBalance), bookBalance: String(reconciliation.bookBalance) }, items.map((item) => ({ ...item, amount: String(item.amount) })));
    },
    markReconciled: (id, reconciledBy) => bankingRepository.markReconciled(id, reconciledBy),
    listImprestRequests: () => bankingRepository.findAllImprestRequests(),
    async getImprestRequestById(id) {
        const request = await bankingRepository.findImprestRequestById(id);
        if (!request)
            throw new NotFoundError(`Imprest request ${id} not found`);
        return request;
    },
    async issueImprest(input) {
        const request = await bankingRepository.createImprestRequest({
            requestNo: `IMP-${Date.now()}`,
            requestedBy: input.requestedBy,
            purpose: input.purpose,
            amountRequested: String(input.amountRequested),
            dateIssued: input.dateIssued,
        });
        const entry = await journalService.postSystemEntry({
            periodId: input.periodId,
            entryDate: input.dateIssued,
            description: `Imprest issued: ${input.purpose}`,
            sourceModule: 'banking',
            sourceReference: `imprest-${request.id}`,
            createdBy: input.requestedBy,
            lines: [
                { accountId: input.imprestControlAccountId, fundId: input.fundId, debit: input.amountRequested },
                { accountId: input.cashAccountId, fundId: input.fundId, credit: input.amountRequested },
            ],
        });
        return bankingRepository.attachIssueJournalEntry(request.id, entry.id);
    },
    async retireImprest(imprestRequestId, input) {
        const request = await bankingRepository.findImprestRequestById(imprestRequestId);
        if (!request)
            throw new NotFoundError(`Imprest request ${imprestRequestId} not found`);
        if (request.status !== 'issued')
            throw new ConflictError(`Imprest request ${imprestRequestId} is not in 'issued' status`);
        const totalExpensed = input.expenseLines.reduce((sum, line) => sum + Number(line.amount), 0);
        const totalCleared = totalExpensed + Number(input.balanceReturned);
        if (Math.round(totalCleared * 100) > Math.round(Number(request.amountRequested) * 100)) {
            throw new ValidationError('Expensed amount plus balance returned exceeds the amount issued');
        }
        const retirement = await bankingRepository.createImprestRetirement({
            imprestRequestId,
            retirementDate: input.retirementDate,
            amountSpent: String(totalExpensed),
            balanceReturned: String(input.balanceReturned),
            receiptsAttached: input.receiptsAttached,
        });
        const lines = [
            ...input.expenseLines.map((line) => ({
                accountId: line.accountId,
                fundId: input.fundId,
                debit: line.amount,
                description: line.description,
            })),
            ...(Number(input.balanceReturned) > 0 && input.cashAccountId
                ? [{ accountId: input.cashAccountId, fundId: input.fundId, debit: input.balanceReturned }]
                : []),
            { accountId: input.imprestControlAccountId, fundId: input.fundId, credit: totalCleared },
        ];
        const entry = await journalService.postSystemEntry({
            periodId: input.periodId,
            entryDate: input.retirementDate,
            description: `Imprest retirement for request ${imprestRequestId}`,
            sourceModule: 'banking',
            sourceReference: `imprest-retirement-${retirement.id}`,
            createdBy: input.recordedBy,
            lines,
        });
        await bankingRepository.markImprestRetired(imprestRequestId);
        return { retirement, journalEntry: entry };
    },
};
