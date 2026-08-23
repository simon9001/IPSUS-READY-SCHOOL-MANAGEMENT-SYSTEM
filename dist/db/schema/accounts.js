import { pgTable, serial, varchar, text, boolean, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
export const accountTypeEnum = pgEnum('account_type', [
    'asset',
    'liability',
    'net_assets', // IPSAS term for equity in a public-sector entity
    'revenue',
    'expense',
]);
export const normalBalanceEnum = pgEnum('normal_balance', ['debit', 'credit']);
export const accounts = pgTable('accounts', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 150 }).notNull(),
    type: accountTypeEnum('type').notNull(),
    normalBalance: normalBalanceEnum('normal_balance').notNull(),
    parentId: integer('parent_id').references(() => accounts.id),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
