import { notificationsRepository } from './notifications.repository.js'
import { consoleNotificationProvider, type NotificationProvider } from './notifications.provider.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'
import { renderTemplate } from '../../common/template.js'
import type { CreateTemplateInput, SendNotificationInput } from './notifications.schema.js'

export function createNotificationsService(provider: NotificationProvider = consoleNotificationProvider) {
  return {
    listTemplates: () => notificationsRepository.findAllTemplates(),
    createTemplate: (input: CreateTemplateInput) => notificationsRepository.createTemplate(input),

    listByRecipient: (recipientUserId: number) => notificationsRepository.findByRecipient(recipientUserId),

    async send(input: SendNotificationInput) {
      let channel = input.channel
      let subject = input.subject
      let body = input.body

      if (input.templateCode) {
        const template = await notificationsRepository.findTemplateByCode(input.templateCode)
        if (!template) throw new NotFoundError(`Notification template "${input.templateCode}" not found`)
        if (!template.isActive) throw new ValidationError(`Notification template "${input.templateCode}" is inactive`)
        channel = channel ?? template.channel
        subject = subject ?? template.subject ?? undefined
        body = renderTemplate(template.bodyTemplate, input.templateData)
      }

      if (!channel || !body) throw new ValidationError('Unable to resolve channel/body for this notification')

      let recipientPhone = input.recipientPhone
      let recipientEmail = input.recipientEmail
      if (input.recipientUserId) {
        const contact = await notificationsRepository.findUserContact(input.recipientUserId)
        recipientPhone = recipientPhone ?? contact?.phone ?? undefined
        recipientEmail = recipientEmail ?? contact?.email ?? undefined
      }

      const notification = await notificationsRepository.create({
        recipientUserId: input.recipientUserId,
        recipientPhone,
        recipientEmail,
        channel,
        subject,
        body,
        status: 'pending',
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        createdBy: input.createdBy,
      })

      if (channel === 'in_app') {
        return notificationsRepository.markSent(notification.id)
      }

      const to = channel === 'sms' ? recipientPhone : recipientEmail
      if (!to) {
        return notificationsRepository.markFailed(notification.id, `No ${channel === 'sms' ? 'phone number' : 'email address'} available for recipient`)
      }

      const result = await provider.send({ channel, to, subject, body })
      return result.success
        ? notificationsRepository.markSent(notification.id)
        : notificationsRepository.markFailed(notification.id, result.failureReason ?? 'Unknown error')
    },
  }
}

export const notificationsService = createNotificationsService()
