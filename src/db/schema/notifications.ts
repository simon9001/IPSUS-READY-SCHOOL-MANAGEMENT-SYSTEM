import { pgTable, serial, varchar, integer, text, boolean, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { users } from './identity.js'

export const notificationChannelEnum = pgEnum('notification_channel', ['sms', 'email', 'in_app'])

export const notificationTemplates = pgTable('notification_templates', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 60 }).notNull().unique(), // e.g. 'FEE_REMINDER', 'EXAM_RESULTS_PUBLISHED'
  channel: notificationChannelEnum('channel').notNull(),
  subject: varchar('subject', { length: 150 }), // email only
  bodyTemplate: text('body_template').notNull(), // supports {{placeholders}}
  isActive: boolean('is_active').notNull().default(true),
})

export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'failed'])

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => notificationTemplates.id),
  recipientUserId: integer('recipient_user_id').references(() => users.id),
  recipientPhone: varchar('recipient_phone', { length: 30 }), // snapshot at send time
  recipientEmail: varchar('recipient_email', { length: 150 }),
  channel: notificationChannelEnum('channel').notNull(),
  subject: varchar('subject', { length: 150 }),
  body: text('body').notNull(),
  status: notificationStatusEnum('status').notNull().default('pending'),
  relatedEntityType: varchar('related_entity_type', { length: 60 }), // e.g. 'fee_invoice', 'exam'
  relatedEntityId: varchar('related_entity_id', { length: 60 }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  createdBy: integer('created_by').references(() => users.id), // null = system-generated
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
