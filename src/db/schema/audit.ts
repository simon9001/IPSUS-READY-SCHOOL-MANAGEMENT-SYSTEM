import { pgTable, serial, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { users } from './identity.js'

// Immutable log of who changed what — required for OAG/BOM audit trail scrutiny.
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 60 }).notNull(),
  entityId: varchar('entity_id', { length: 60 }).notNull(),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
