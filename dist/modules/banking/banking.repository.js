import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { bankAccounts, bankReconciliations, bankReconciliationItems, imprestRequests, imprestRetirements } from '../../db/schema/index.js';
export const bankingRepository = {
    findAllAccounts: () => db.select().from(bankAccounts),
    findAccountById: (id) => db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).then((rows) => rows[0]),
    createAccount: (data) => db.insert(bankAccounts).values(data).returning().then((rows) => rows[0]),
    findReconciliationsByAccount: (bankAccountId) => db.select().from(bankReconciliations).where(eq(bankReconciliations.bankAccountId, bankAccountId)),
    async createReconciliation(data, items) {
        return db.transaction(async (tx) => {
            const [reconciliation] = await tx.insert(bankReconciliations).values(data).returning();
            if (items.length > 0) {
                await tx.insert(bankReconciliationItems).values(items.map((item) => ({ ...item, reconciliationId: reconciliation.id })));
            }
            return reconciliation;
        });
    },
    markReconciled: (id, reconciledBy) => db
        .update(bankReconciliations)
        .set({ status: 'reconciled', reconciledBy, reconciledAt: new Date() })
        .where(eq(bankReconciliations.id, id))
        .returning()
        .then((rows) => rows[0]),
    findAllImprestRequests: () => db.select().from(imprestRequests),
    findImprestRequestById: (id) => db.select().from(imprestRequests).where(eq(imprestRequests.id, id)).then((rows) => rows[0]),
    createImprestRequest: (data) => db.insert(imprestRequests).values(data).returning().then((rows) => rows[0]),
    attachIssueJournalEntry: (id, journalEntryId) => db
        .update(imprestRequests)
        .set({ status: 'issued', journalEntryId })
        .where(eq(imprestRequests.id, id))
        .returning()
        .then((rows) => rows[0]),
    createImprestRetirement: (data) => db.insert(imprestRetirements).values(data).returning().then((rows) => rows[0]),
    markImprestRetired: (id) => db.update(imprestRequests).set({ status: 'retired' }).where(eq(imprestRequests.id, id)).returning().then((rows) => rows[0]),
};
