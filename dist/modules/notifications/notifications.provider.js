/**
 * Local-dev stub — logs instead of actually dispatching. Swap this out for
 * a real provider (e.g. Africa's Talking for SMS, SMTP/SES for email) by
 * implementing NotificationProvider and passing it into notifications.service.
 */
export const consoleNotificationProvider = {
    async send({ channel, to, subject, body }) {
        console.log(`[notification:${channel}] to=${to}${subject ? ` subject="${subject}"` : ''} body="${body}"`);
        return { success: true };
    },
};
