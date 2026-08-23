import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { inventoryItems, stockMovements } from '../../db/schema/index.js';
export const inventoryRepository = {
    findAllItems: () => db.select().from(inventoryItems),
    findItemById: (id) => db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).then((rows) => rows[0]),
    createItem: (data) => db.insert(inventoryItems).values(data).returning().then((rows) => rows[0]),
    findMovementsByItem: (itemId) => db.select().from(stockMovements).where(eq(stockMovements.itemId, itemId)),
    createMovement: (data) => db.insert(stockMovements).values(data).returning().then((rows) => rows[0]),
};
