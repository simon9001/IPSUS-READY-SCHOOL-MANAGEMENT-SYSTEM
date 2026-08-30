import { inventoryRepository } from './inventory.repository.js'
import { journalService } from '../journal/journal.service.js'
import { NotFoundError } from '../../common/errors.js'
import type { CreateItemInput, IssueStockInput, ReceiveStockInput } from './inventory.schema.js'

export const inventoryService = {
  listItems: () => inventoryRepository.findAllItems(),

  async getItemById(id: number) {
    const item = await inventoryRepository.findItemById(id)
    if (!item) throw new NotFoundError(`Inventory item ${id} not found`)
    return item
  },

  createItem: (input: CreateItemInput) =>
    inventoryRepository.createItem({ ...input, reorderLevel: input.reorderLevel !== undefined ? String(input.reorderLevel) : undefined }),

  listMovements: (itemId: number) => inventoryRepository.findMovementsByItem(itemId),
  listAllMovements: () => inventoryRepository.findAllMovements(),

  async receiveStock(input: ReceiveStockInput) {
    const item = await this.getItemById(input.itemId)
    const amount = Number(input.quantity) * Number(input.unitCost)

    const entry = await journalService.postSystemEntry({
      periodId: input.periodId,
      entryDate: input.movementDate,
      description: `Stock receipt: ${item.name}`,
      sourceModule: 'inventory',
      sourceReference: input.reference,
      createdBy: input.recordedBy,
      lines: [
        { accountId: input.inventoryAccountId, fundId: input.fundId, debit: amount },
        { accountId: input.creditAccountId, fundId: input.fundId, credit: amount },
      ],
    })

    return inventoryRepository.createMovement({
      itemId: input.itemId,
      movementDate: input.movementDate,
      movementType: 'receipt',
      quantity: String(input.quantity),
      unitCost: String(input.unitCost),
      reference: input.reference,
      journalEntryId: entry.id,
    })
  },

  async issueStock(input: IssueStockInput) {
    const item = await this.getItemById(input.itemId)
    const amount = Number(input.quantity) * Number(input.unitCost)

    const entry = await journalService.postSystemEntry({
      periodId: input.periodId,
      entryDate: input.movementDate,
      description: `Stock issue: ${item.name}`,
      sourceModule: 'inventory',
      sourceReference: input.reference,
      createdBy: input.recordedBy,
      lines: [
        { accountId: input.expenseAccountId, fundId: input.fundId, debit: amount },
        { accountId: input.inventoryAccountId, fundId: input.fundId, credit: amount },
      ],
    })

    return inventoryRepository.createMovement({
      itemId: input.itemId,
      movementDate: input.movementDate,
      movementType: 'issue',
      quantity: String(input.quantity),
      unitCost: String(input.unitCost),
      reference: input.reference,
      journalEntryId: entry.id,
    })
  },
}
