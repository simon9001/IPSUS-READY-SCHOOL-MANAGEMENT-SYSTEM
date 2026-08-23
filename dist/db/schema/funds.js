import { pgTable, serial, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
export const restrictionTypeEnum = pgEnum('restriction_type', ['unrestricted', 'restricted']);
export const funds = pgTable('funds', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 150 }).notNull(),
    restrictionType: restrictionTypeEnum('restriction_type').notNull().default('unrestricted'),
    restrictionNotes: text('restriction_notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
