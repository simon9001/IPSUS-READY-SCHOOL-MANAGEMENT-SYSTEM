import { pgTable, serial, integer, varchar, text, jsonb, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { users } from './identity.js'

export const messageChannelEnum = pgEnum('message_channel', ['sms', 'email', 'both'])
export const messageBatchStatusEnum = pgEnum('message_batch_status', ['queued', 'sending', 'completed'])

// One bulk send. The individual messages are ordinary `notifications` rows
// pointing back here; counts are computed from them, never stored.
export const messageBatches = pgTable('message_batches', {
  id: serial('id').primaryKey(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  channel: messageChannelEnum('channel').notNull(),
  audiences: jsonb('audiences').notNull(), // the selections as submitted
  subject: varchar('subject', { length: 150 }),
  body: text('body').notNull(), // the template as written, placeholders unrendered
  status: messageBatchStatusEnum('status').notNull().default('queued'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})
