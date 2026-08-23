import { pgTable, serial, varchar, text, integer, numeric, date, pgEnum } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { funds } from './funds.js';
import { fiscalPeriods } from './periods.js';
import { journalEntries } from './journal.js';
export const depreciationMethodEnum = pgEnum('depreciation_method', ['straight_line', 'reducing_balance']);
export const assetCategories = pgTable('asset_categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(), // e.g. "Buildings", "Lab Equipment", "Buses"
    defaultUsefulLifeYears: integer('default_useful_life_years').notNull(),
    depreciationMethod: depreciationMethodEnum('depreciation_method').notNull().default('straight_line'),
    assetAccountId: integer('asset_account_id').notNull().references(() => accounts.id),
    depreciationExpenseAccountId: integer('depreciation_expense_account_id').notNull().references(() => accounts.id),
    accumulatedDepreciationAccountId: integer('accumulated_depreciation_account_id').notNull().references(() => accounts.id),
});
export const assetStatusEnum = pgEnum('asset_status', ['in_use', 'disposed', 'written_off']);
export const assets = pgTable('assets', {
    id: serial('id').primaryKey(),
    assetTag: varchar('asset_tag', { length: 30 }).notNull().unique(),
    categoryId: integer('category_id').notNull().references(() => assetCategories.id),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description'),
    acquisitionDate: date('acquisition_date').notNull(),
    acquisitionCost: numeric('acquisition_cost', { precision: 14, scale: 2 }).notNull(),
    fundId: integer('fund_id').notNull().references(() => funds.id), // funding source, for disclosure
    location: varchar('location', { length: 100 }),
    status: assetStatusEnum('status').notNull().default('in_use'),
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
});
export const depreciationEntries = pgTable('depreciation_entries', {
    id: serial('id').primaryKey(),
    assetId: integer('asset_id').notNull().references(() => assets.id),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
});
export const assetDisposals = pgTable('asset_disposals', {
    id: serial('id').primaryKey(),
    assetId: integer('asset_id').notNull().references(() => assets.id),
    disposalDate: date('disposal_date').notNull(),
    proceeds: numeric('proceeds', { precision: 14, scale: 2 }).notNull().default('0'),
    netBookValueAtDisposal: numeric('net_book_value_at_disposal', { precision: 14, scale: 2 }).notNull(),
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
});
