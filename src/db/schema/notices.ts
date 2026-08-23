import { pgTable, serial, varchar, integer, text, date, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { classes } from './students.js'
import { users } from './identity.js'

export const noticeAudienceEnum = pgEnum('notice_audience', ['all', 'parents', 'staff', 'class'])

export const notices = pgTable('notices', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  audience: noticeAudienceEnum('audience').notNull().default('all'),
  classId: integer('class_id').references(() => classes.id), // set when audience = 'class'
  publishedBy: integer('published_by').notNull().references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }), // null = draft
  expiresAt: date('expires_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
