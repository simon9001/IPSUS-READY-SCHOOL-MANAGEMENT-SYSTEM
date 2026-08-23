import { assetsRepository } from './assets.repository.js'
import { journalService } from '../journal/journal.service.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { AcquireAssetInput, CreateAssetCategoryInput, DisposeAssetInput, RunDepreciationInput } from './assets.schema.js'

export const assetsService = {
  listCategories: () => assetsRepository.findAllCategories(),
  createCategory: (input: CreateAssetCategoryInput) => assetsRepository.createCategory(input),

  list: () => assetsRepository.findAll(),

  async getById(id: number) {
    const asset = await assetsRepository.findById(id)
    if (!asset) throw new NotFoundError(`Asset ${id} not found`)
    return asset
  },

  async acquire(input: AcquireAssetInput) {
    const category = await assetsRepository.findCategoryById(input.categoryId)
    if (!category) throw new NotFoundError(`Asset category ${input.categoryId} not found`)

    const asset = await assetsRepository.create({
      assetTag: input.assetTag,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      acquisitionDate: input.acquisitionDate,
      acquisitionCost: String(input.acquisitionCost),
      fundId: input.fundId,
      location: input.location,
    })

    const entry = await journalService.postSystemEntry({
      periodId: input.periodId,
      entryDate: input.acquisitionDate,
      description: `Acquisition of asset ${input.name}`,
      sourceModule: 'assets',
      sourceReference: `asset-${asset.id}`,
      createdBy: input.createdBy,
      lines: [
        { accountId: category.assetAccountId, fundId: input.fundId, debit: input.acquisitionCost },
        { accountId: input.creditAccountId, fundId: input.fundId, credit: input.acquisitionCost },
      ],
    })

    return assetsRepository.attachJournalEntry(asset.id, entry.id)
  },

  /** Straight-line only: cost / usefulLifeYears per run, capped at cost. */
  async runDepreciation(input: RunDepreciationInput) {
    const inUseAssets = await assetsRepository.findInUse()
    const results = []

    for (const asset of inUseAssets) {
      const category = await assetsRepository.findCategoryById(asset.categoryId)
      if (!category || category.depreciationMethod !== 'straight_line') continue

      const cost = Number(asset.acquisitionCost)
      const accumulated = await assetsRepository.accumulatedDepreciation(asset.id)
      if (accumulated >= cost) continue

      const annualCharge = cost / category.defaultUsefulLifeYears
      const charge = Math.min(annualCharge, cost - accumulated)
      if (charge <= 0) continue

      const entry = await journalService.postSystemEntry({
        periodId: input.periodId,
        entryDate: input.asOfDate,
        description: `Depreciation - ${asset.name}`,
        sourceModule: 'assets',
        sourceReference: `depreciation-${asset.id}-${input.asOfDate}`,
        createdBy: input.createdBy,
        lines: [
          { accountId: category.depreciationExpenseAccountId, fundId: asset.fundId, debit: charge },
          { accountId: category.accumulatedDepreciationAccountId, fundId: asset.fundId, credit: charge },
        ],
      })

      const depreciationEntry = await assetsRepository.createDepreciationEntry({
        assetId: asset.id,
        periodId: input.periodId,
        amount: charge.toFixed(2),
        journalEntryId: entry.id,
      })

      results.push(depreciationEntry)
    }

    return results
  },

  async dispose(assetId: number, input: DisposeAssetInput) {
    const asset = await assetsRepository.findById(assetId)
    if (!asset) throw new NotFoundError(`Asset ${assetId} not found`)
    if (asset.status !== 'in_use') throw new ConflictError(`Asset ${assetId} is not in use`)

    const category = await assetsRepository.findCategoryById(asset.categoryId)
    if (!category) throw new NotFoundError(`Asset category ${asset.categoryId} not found`)

    const accumulated = await assetsRepository.accumulatedDepreciation(assetId)
    const cost = Number(asset.acquisitionCost)
    const netBookValue = cost - accumulated
    const proceeds = Number(input.proceeds)
    const gainLoss = proceeds - netBookValue

    const lines = [
      { accountId: category.accumulatedDepreciationAccountId, fundId: asset.fundId, debit: accumulated },
      { accountId: input.cashAccountId, fundId: asset.fundId, debit: proceeds },
      { accountId: category.assetAccountId, fundId: asset.fundId, credit: cost },
    ]
    if (gainLoss > 0) lines.push({ accountId: input.gainLossAccountId, fundId: asset.fundId, credit: gainLoss })
    if (gainLoss < 0) lines.push({ accountId: input.gainLossAccountId, fundId: asset.fundId, debit: -gainLoss })

    const entry = await journalService.postSystemEntry({
      periodId: input.periodId,
      entryDate: input.disposalDate,
      description: `Disposal of asset ${asset.name}`,
      sourceModule: 'assets',
      sourceReference: `disposal-${assetId}`,
      createdBy: input.recordedBy,
      lines,
    })

    const disposal = await assetsRepository.createDisposal({
      assetId,
      disposalDate: input.disposalDate,
      proceeds: proceeds.toFixed(2),
      netBookValueAtDisposal: netBookValue.toFixed(2),
      journalEntryId: entry.id,
    })

    await assetsRepository.markDisposed(assetId)
    return disposal
  },
}
