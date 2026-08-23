import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { bankAccounts, bankReconciliations, bankReconciliationItems, imprestRequests, imprestRetirements } from '../../db/schema/index.js'
import type {
  NewBankAccount,
  NewBankReconciliation,
  NewBankReconciliationItem,
  NewImprestRequest,
  NewImprestRetirement,
} from './banking.types.js'

export const bankingRepository = {
  findAllAccounts: () => db.select().from(bankAccounts),
  findAccountById: (id: number) =>
    db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).then((rows) => rows[0]),
  createAccount: (data: NewBankAccount) =>
    db.insert(bankAccounts).values(data).returning().then((rows) => rows[0]),

  findReconciliationsByAccount: (bankAccountId: number) =>
    db.select().from(bankReconciliations).where(eq(bankReconciliations.bankAccountId, bankAccountId)),

  async createReconciliation(data: NewBankReconciliation, items: Omit<NewBankReconciliationItem, 'reconciliationId'>[]) {
    return db.transaction(async (tx) => {
      const [reconciliation] = await tx.insert(bankReconciliations).values(data).returning()
      if (items.length > 0) {
        await tx.insert(bankReconciliationItems).values(items.map((item) => ({ ...item, reconciliationId: reconciliation.id })))
      }
      return reconciliation
    })
  },

  markReconciled: (id: number, reconciledBy: number) =>
    db
      .update(bankReconciliations)
      .set({ status: 'reconciled', reconciledBy, reconciledAt: new Date() })
      .where(eq(bankReconciliations.id, id))
      .returning()
      .then((rows) => rows[0]),

  findAllImprestRequests: () => db.select().from(imprestRequests),
  findImprestRequestById: (id: number) =>
    db.select().from(imprestRequests).where(eq(imprestRequests.id, id)).then((rows) => rows[0]),
  createImprestRequest: (data: NewImprestRequest) =>
    db.insert(imprestRequests).values(data).returning().then((rows) => rows[0]),
  attachIssueJournalEntry: (id: number, journalEntryId: number) =>
    db
      .update(imprestRequests)
      .set({ status: 'issued', journalEntryId })
      .where(eq(imprestRequests.id, id))
      .returning()
      .then((rows) => rows[0]),

  createImprestRetirement: (data: NewImprestRetirement) =>
    db.insert(imprestRetirements).values(data).returning().then((rows) => rows[0]),
  markImprestRetired: (id: number) =>
    db.update(imprestRequests).set({ status: 'retired' }).where(eq(imprestRequests.id, id)).returning().then((rows) => rows[0]),
}
