import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { assetCategories, assetDisposals, assets, depreciationEntries } from '../../db/schema/index.js';
export const assetsRepository = {
    findAllCategories: () => db.select().from(assetCategories),
    findCategoryById: (id) => db.select().from(assetCategories).where(eq(assetCategories.id, id)).then((rows) => rows[0]),
    createCategory: (data) => db.insert(assetCategories).values(data).returning().then((rows) => rows[0]),
    findAll: () => db.select().from(assets),
    findById: (id) => db.select().from(assets).where(eq(assets.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(assets).values(data).returning().then((rows) => rows[0]),
    attachJournalEntry: (id, journalEntryId) => db.update(assets).set({ journalEntryId }).where(eq(assets.id, id)).returning().then((rows) => rows[0]),
    markDisposed: (id) => db.update(assets).set({ status: 'disposed' }).where(eq(assets.id, id)).returning().then((rows) => rows[0]),
    findInUse: () => db.select().from(assets).where(eq(assets.status, 'in_use')),
    async accumulatedDepreciation(assetId) {
        const [row] = await db
            .select({ total: sql `coalesce(sum(${depreciationEntries.amount}), 0)` })
            .from(depreciationEntries)
            .where(eq(depreciationEntries.assetId, assetId));
        return Number(row?.total ?? 0);
    },
    createDepreciationEntry: (data) => db.insert(depreciationEntries).values(data).returning().then((rows) => rows[0]),
    createDisposal: (data) => db.insert(assetDisposals).values(data).returning().then((rows) => rows[0]),
};
