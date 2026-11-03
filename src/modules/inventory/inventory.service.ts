import { inventoryRepository } from './inventory.repository.js'
import { withTransaction } from '../../db/client.js'
import { journalService } from '../journal/journal.service.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'
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
    return withTransaction(async () => {
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
    })
  },

  async issueStock(input: IssueStockInput) {
    return withTransaction(async () => {
      const item = await this.getItemById(input.itemId)

      const movements = await inventoryRepository.findMovementsByItem(input.itemId)
      const onHand = movements.reduce((sum, m) => sum + Number(m.quantity) * (m.movementType === 'issue' ? -1 : 1), 0)
      if (Number(input.quantity) > onHand) {
        throw new ValidationError(`Cannot issue ${input.quantity} ${item.unit} of ${item.name}: only ${onHand} in stock`)
      }

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
    })
  },
}
