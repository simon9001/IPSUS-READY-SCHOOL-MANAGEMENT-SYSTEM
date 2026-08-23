import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { notificationTemplates, notifications, users } from '../../db/schema/index.js'
import type { NewNotification, NewNotificationTemplate } from './notifications.types.js'

export const notificationsRepository = {
  findAllTemplates: () => db.select().from(notificationTemplates),
  findTemplateByCode: (code: string) =>
    db.select().from(notificationTemplates).where(eq(notificationTemplates.code, code)).then((rows) => rows[0]),
  createTemplate: (data: NewNotificationTemplate) =>
    db.insert(notificationTemplates).values(data).returning().then((rows) => rows[0]),

  findUserContact: (userId: number) =>
    db
      .select({ phone: users.phone, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0]),

  create: (data: NewNotification) => db.insert(notifications).values(data).returning().then((rows) => rows[0]),

  markSent: (id: number) =>
    db.update(notifications).set({ status: 'sent', sentAt: new Date() }).where(eq(notifications.id, id)).returning().then((rows) => rows[0]),

  markFailed: (id: number, reason: string) =>
    db.update(notifications).set({ status: 'failed', failureReason: reason }).where(eq(notifications.id, id)).returning().then((rows) => rows[0]),

  findByRecipient: (recipientUserId: number) => db.select().from(notifications).where(eq(notifications.recipientUserId, recipientUserId)),
}
