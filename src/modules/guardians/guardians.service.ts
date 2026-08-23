import { guardiansRepository } from './guardians.repository.js'
import { notificationsService } from '../notifications/notifications.service.js'
import { ConflictError, ForbiddenError } from '../../common/errors.js'
import type { LinkGuardianInput } from './guardians.schema.js'

export const guardiansService = {
  listStudentsForGuardian: (userId: number) => guardiansRepository.findStudentsByGuardian(userId),
  listGuardiansForStudent: (studentId: number) => guardiansRepository.findGuardiansByStudent(studentId),

  /**
   * Fire-and-forget notification to every guardian of a student — used by
   * discipline/disciplinary-case events. Swallows errors so a notification
   * failure (e.g. no guardian linked yet) never blocks the calling action.
   */
  async notifyGuardians(
    studentId: number,
    params: { channel: 'sms' | 'email' | 'in_app'; subject?: string; body: string; relatedEntityType?: string; relatedEntityId?: string; createdBy?: number },
  ) {
    try {
      const links = await guardiansRepository.findGuardiansByStudent(studentId)
      await Promise.all(
        links.map((link) =>
          notificationsService.send({
            channel: params.channel,
            subject: params.subject,
            body: params.body,
            recipientUserId: link.userId,
            templateData: {},
            relatedEntityType: params.relatedEntityType,
            relatedEntityId: params.relatedEntityId,
            createdBy: params.createdBy,
          }),
        ),
      )
    } catch (err) {
      console.error(`Failed to notify guardians of student ${studentId}:`, err)
    }
  },

  async link(input: LinkGuardianInput) {
    const existing = await guardiansRepository.findLink(input.userId, input.studentId)
    if (existing) throw new ConflictError('This guardian is already linked to this student')
    return guardiansRepository.link(input)
  },

  /** Resource-ownership check used by the parent portal — not an RBAC
   *  permission check, since "portal.access" only says a user CAN use the
   *  portal, not which students they're allowed to see. */
  async assertGuardianOfStudent(userId: number, studentId: number) {
    const link = await guardiansRepository.findLink(userId, studentId)
    if (!link) throw new ForbiddenError(`User ${userId} is not a registered guardian of student ${studentId}`)
  },
}
