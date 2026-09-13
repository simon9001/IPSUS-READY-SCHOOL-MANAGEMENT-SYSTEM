import { admissionsRepository } from './admissions.repository.js'
import { studentsRepository } from '../students/students.repository.js'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js'
import { broadcastChange } from '../../common/events.js'
import { recordAudit } from '../../common/audit.js'
import type {
  ApplyDirectInput,
  CapturePlacementInput,
  CaptureTransferInput,
  DecideAdmissionInput,
  EnrollAdmissionInput,
  RecordInterviewResultInput,
  ScheduleInterviewInput,
} from './admissions.schema.js'

function nextApplicationNo(): string {
  return `ADM-${Date.now()}`
}

async function assertUpiNotAlreadyUsed(nemisUpi: string) {
  const existing = await admissionsRepository.findByUpi(nemisUpi)
  if (existing) throw new ConflictError(`An admission record already exists for NEMIS UPI ${nemisUpi}`)
}

export const admissionsService = {
  list: () => admissionsRepository.findAll(),

  async getById(id: number) {
    const admission = await admissionsRepository.findById(id)
    if (!admission) throw new NotFoundError(`Admission ${id} not found`)
    return admission
  },

  /** Government JSS/Senior School placement — decided already, so this goes
   *  straight to 'admitted' with no interview step. */
  async capturePlacement(input: CapturePlacementInput, actorUserId: number) {
    await assertUpiNotAlreadyUsed(input.nemisUpi)
    const created = await admissionsRepository.create({
      ...input,
      applicationNo: nextApplicationNo(),
      admissionType: 'placement',
      status: 'admitted',
      decidedAt: new Date(),
    })
    await recordAudit({ userId: actorUserId, action: `admission.capture_${created.admissionType}`, entityType: 'admission', entityId: created.id, afterData: created })
    broadcastChange('admissions', 'captured')
    broadcastChange('dashboard', 'updated')
    return created
  },

  /** Inter-school transfer — also decided already; NEMIS UPI carries over. */
  async captureTransfer(input: CaptureTransferInput, actorUserId: number) {
    await assertUpiNotAlreadyUsed(input.nemisUpi)
    const created = await admissionsRepository.create({
      ...input,
      applicationNo: nextApplicationNo(),
      admissionType: 'transfer',
      status: 'admitted',
      decidedAt: new Date(),
    })
    await recordAudit({ userId: actorUserId, action: `admission.capture_${created.admissionType}`, entityType: 'admission', entityId: created.id, afterData: created })
    broadcastChange('admissions', 'captured')
    broadcastChange('dashboard', 'updated')
    return created
  },

  /** Direct/local admission — the only pathway with an interview step. */
  applyDirect: async (input: ApplyDirectInput, actorUserId: number) => {
    const created = await admissionsRepository.create({ ...input, applicationNo: nextApplicationNo(), admissionType: 'direct', status: 'pending' })
    await recordAudit({ userId: actorUserId, action: 'admission.apply', entityType: 'admission', entityId: created.id, afterData: created })
    broadcastChange('admissions', 'applied')
    broadcastChange('dashboard', 'updated')
    return created
  },

  async scheduleInterview(id: number, input: ScheduleInterviewInput, actorUserId: number) {
    const admission = await this.getById(id)
    if (admission.admissionType !== 'direct') throw new ValidationError('Only direct applications go through an interview')
    if (admission.status !== 'pending') throw new ConflictError(`Admission ${id} is ${admission.status}, not pending`)
    const updated = await admissionsRepository.update(id, { ...input, status: 'interview_scheduled' })
    await recordAudit({ userId: actorUserId, action: 'admission.schedule_interview', entityType: 'admission', entityId: id, beforeData: admission, afterData: updated })
    broadcastChange('admissions', 'interview_scheduled')
    broadcastChange('dashboard', 'updated')
    return updated
  },

  async recordInterviewResult(id: number, input: RecordInterviewResultInput, actorUserId: number) {
    const admission = await this.getById(id)
    if (admission.status !== 'interview_scheduled') throw new ConflictError(`Admission ${id} has no scheduled interview`)
    const updated = await admissionsRepository.update(id, {
      interviewScore: input.interviewScore !== undefined ? String(input.interviewScore) : undefined,
      interviewNotes: input.interviewNotes,
    })
    await recordAudit({ userId: actorUserId, action: 'admission.record_interview_result', entityType: 'admission', entityId: id, beforeData: admission, afterData: updated })
    broadcastChange('admissions', 'interview_recorded')
    broadcastChange('dashboard', 'updated')
    return updated
  },

  async decide(id: number, input: DecideAdmissionInput, actorUserId: number) {
    const admission = await this.getById(id)
    if (admission.status === 'admitted' || admission.status === 'enrolled') {
      throw new ConflictError(`Admission ${id} is already ${admission.status}`)
    }
    const updated = await admissionsRepository.update(id, {
      status: input.decision,
      decidedBy: input.decidedBy,
      decidedAt: new Date(),
      rejectionReason: input.decision === 'rejected' ? input.rejectionReason : undefined,
    })
    await recordAudit({ userId: actorUserId, action: 'admission.decide', entityType: 'admission', entityId: id, beforeData: admission, afterData: updated })
    broadcastChange('admissions', 'decided')
    broadcastChange('dashboard', 'updated')
    return updated
  },

  /** Converts an admitted applicant into an actual enrolled student record. */
  async enroll(id: number, input: EnrollAdmissionInput, actorUserId: number) {
    const admission = await this.getById(id)
    if (admission.status !== 'admitted') throw new ConflictError(`Admission ${id} must be 'admitted' before enrolling, currently ${admission.status}`)

    const student = await studentsRepository.create({
      admissionNo: input.admissionNo,
      nemisUpi: admission.nemisUpi,
      firstName: admission.firstName,
      lastName: admission.lastName,
      otherNames: admission.otherNames,
      gender: admission.gender,
      dateOfBirth: admission.dateOfBirth,
      classId: admission.targetClassId,
      streamId: input.streamId,
      boardingStatus: admission.boardingStatus as 'day' | 'boarder',
      guardianName: admission.guardianName,
      guardianPhone: admission.guardianPhone,
      guardianEmail: admission.guardianEmail,
      admissionDate: input.admissionDate,
    })

    const enrolled = await admissionsRepository.update(id, { status: 'enrolled', studentId: student.id, enrolledAt: new Date() })
    await recordAudit({ userId: actorUserId, action: 'admission.enroll', entityType: 'admission', entityId: id, beforeData: admission, afterData: enrolled })
    // Enrolment creates the student, so the student's own trail starts here too.
    await recordAudit({ userId: actorUserId, action: 'student.create', entityType: 'student', entityId: student.id, afterData: student })
    broadcastChange('admissions', 'enrolled')
    broadcastChange('students', 'enrolled')
    broadcastChange('dashboard', 'updated')
    return enrolled
  },
}
