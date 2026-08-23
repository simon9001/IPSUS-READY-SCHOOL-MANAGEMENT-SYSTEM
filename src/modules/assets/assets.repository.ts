import { eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { assetCategories, assetDisposals, assets, depreciationEntries } from '../../db/schema/index.js'
import type { NewAsset, NewAssetCategory, NewAssetDisposal, NewDepreciationEntry } from './assets.types.js'

export const assetsRepository = {
  findAllCategories: () => db.select().from(assetCategories),
  findCategoryById: (id: number) =>
    db.select().from(assetCategories).where(eq(assetCategories.id, id)).then((rows) => rows[0]),
  createCategory: (data: NewAssetCategory) =>
    db.insert(assetCategories).values(data).returning().then((rows) => rows[0]),

  findAll: () => db.select().from(assets),
  findById: (id: number) =>
    db.select().from(assets).where(eq(assets.id, id)).then((rows) => rows[0]),
  create: (data: NewAsset) =>
    db.insert(assets).values(data).returning().then((rows) => rows[0]),
  attachJournalEntry: (id: number, journalEntryId: number) =>
    db.update(assets).set({ journalEntryId }).where(eq(assets.id, id)).returning().then((rows) => rows[0]),
  markDisposed: (id: number) =>
    db.update(assets).set({ status: 'disposed' }).where(eq(assets.id, id)).returning().then((rows) => rows[0]),

  findInUse: () => db.select().from(assets).where(eq(assets.status, 'in_use')),

  async accumulatedDepreciation(assetId: number) {
    const [row] = await db
      .select({ total: sql<string>`coalesce(sum(${depreciationEntries.amount}), 0)` })
      .from(depreciationEntries)
      .where(eq(depreciationEntries.assetId, assetId))
    return Number(row?.total ?? 0)
  },

  createDepreciationEntry: (data: NewDepreciationEntry) =>
    db.insert(depreciationEntries).values(data).returning().then((rows) => rows[0]),

  createDisposal: (data: NewAssetDisposal) =>
    db.insert(assetDisposals).values(data).returning().then((rows) => rows[0]),
}
