import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { inventoryItems, stockMovements } from '../../db/schema/index.js'
import type { NewInventoryItem, NewStockMovement } from './inventory.types.js'

export const inventoryRepository = {
  findAllItems: () => db.select().from(inventoryItems),
  findItemById: (id: number) =>
    db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).then((rows) => rows[0]),
  createItem: (data: NewInventoryItem) =>
    db.insert(inventoryItems).values(data).returning().then((rows) => rows[0]),

  findMovementsByItem: (itemId: number) =>
    db.select().from(stockMovements).where(eq(stockMovements.itemId, itemId)),

  createMovement: (data: NewStockMovement) =>
    db.insert(stockMovements).values(data).returning().then((rows) => rows[0]),
}
