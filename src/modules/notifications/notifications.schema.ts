import { z } from 'zod'

export const createTemplateSchema = z.object({
  code: z.string().min(1).max(60),
  channel: z.enum(['sms', 'email']),
  subject: z.string().max(150).optional(),
  bodyTemplate: z.string().min(1),
  isActive: z.boolean().default(true),
})

export const sendNotificationSchema = z
  .object({
    templateCode: z.string().optional(),
    templateData: z.record(z.string(), z.string()).default({}),
    channel: z.enum(['sms', 'email', 'in_app']).optional(),
    subject: z.string().max(150).optional(),
    body: z.string().optional(),
    recipientUserId: z.number().int().positive().optional(),
    recipientPhone: z.string().max(30).optional(),
    recipientEmail: z.string().email().max(150).optional(),
    relatedEntityType: z.string().max(60).optional(),
    relatedEntityId: z.string().max(60).optional(),
    createdBy: z.number().int().positive().optional(),
  })
  .refine((v) => v.templateCode || v.body, { message: 'Either templateCode or body must be provided' })
  .refine((v) => v.recipientUserId || v.recipientPhone || v.recipientEmail, {
    message: 'A recipient (recipientUserId, recipientPhone, or recipientEmail) is required',
  })

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>
