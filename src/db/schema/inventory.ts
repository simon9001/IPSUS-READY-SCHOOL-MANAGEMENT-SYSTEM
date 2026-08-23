import { pgTable, serial, varchar, integer, numeric, date, pgEnum } from 'drizzle-orm/pg-core'
import { journalEntries } from './journal.js'

export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  itemCode: varchar('item_code', { length: 30 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(), // e.g. "kg", "bag", "ream"
  category: varchar('category', { length: 60 }), // e.g. "Food Stores", "Stationery", "Textbooks"
  reorderLevel: numeric('reorder_level', { precision: 12, scale: 2 }),
})

export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['receipt', 'issue', 'adjustment'])

export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').notNull().references(() => inventoryItems.id),
  movementDate: date('movement_date').notNull(),
  movementType: stockMovementTypeEnum('movement_type').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 14, scale: 2 }),
  reference: varchar('reference', { length: 60 }),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
})
