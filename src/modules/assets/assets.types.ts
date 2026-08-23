import type { assetCategories, assets, depreciationEntries, assetDisposals } from '../../db/schema/index.js'

export type AssetCategory = typeof assetCategories.$inferSelect
export type NewAssetCategory = typeof assetCategories.$inferInsert
export type Asset = typeof assets.$inferSelect
export type NewAsset = typeof assets.$inferInsert
export type DepreciationEntry = typeof depreciationEntries.$inferSelect
export type NewDepreciationEntry = typeof depreciationEntries.$inferInsert
export type AssetDisposal = typeof assetDisposals.$inferSelect
export type NewAssetDisposal = typeof assetDisposals.$inferInsert
