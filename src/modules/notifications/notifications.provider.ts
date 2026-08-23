export interface SendResult {
  success: boolean
  failureReason?: string
}

export interface NotificationProvider {
  send(params: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }): Promise<SendResult>
}

/**
 * Local-dev stub — logs instead of actually dispatching. Swap this out for
 * a real provider (e.g. Africa's Talking for SMS, SMTP/SES for email) by
 * implementing NotificationProvider and passing it into notifications.service.
 */
export const consoleNotificationProvider: NotificationProvider = {
  async send({ channel, to, subject, body }) {
    console.log(`[notification:${channel}] to=${to}${subject ? ` subject="${subject}"` : ''} body="${body}"`)
    return { success: true }
  },
}
