import { boardingRepository } from './boarding.repository.js'
import { studentsRepository } from '../students/students.repository.js'
import { guardiansService } from '../guardians/guardians.service.js'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js'
import type { AllocateBedInput, CreateDormitoryInput, MarkBoardingAttendanceInput } from './boarding.schema.js'

export const boardingService = {
  listDormitories: () => boardingRepository.findAllDormitories(),

  async getDormitoryById(id: number) {
    const dorm = await boardingRepository.findDormitoryById(id)
    if (!dorm) throw new NotFoundError(`Dormitory ${id} not found`)
    return dorm
  },

  createDormitory: (input: CreateDormitoryInput) => boardingRepository.createDormitory(input),

  listAllocationsByDormitory: (dormitoryId: number) => boardingRepository.findAllocationsByDormitory(dormitoryId),

  async allocateBed(input: AllocateBedInput) {
    const student = await boardingRepository.findStudentBoardingStatus(input.studentId)
    if (!student) throw new NotFoundError(`Student ${input.studentId} not found`)
    if (student.boardingStatus !== 'boarder') throw new ValidationError('Only boarding students can be allocated a bed')

    const existing = await boardingRepository.findActiveAllocationForStudent(input.studentId)
    if (existing) throw new ConflictError(`Student ${input.studentId} already has an active bed allocation — vacate it first`)

    const dorm = await this.getDormitoryById(input.dormitoryId)
    const occupancy = await boardingRepository.activeOccupancy(input.dormitoryId)
    if (occupancy >= dorm.capacity) throw new ConflictError(`Dormitory ${dorm.name} is at full capacity (${dorm.capacity})`)

    const bedOccupant = await boardingRepository.findBedOccupant(input.dormitoryId, input.bedNumber)
    if (bedOccupant) throw new ConflictError(`Bed ${input.bedNumber} in ${dorm.name} is already occupied`)

    return boardingRepository.createAllocation(input)
  },

  async vacateBed(id: number, vacatedDate: string) {
    const allocation = await boardingRepository.findAllocationById(id)
    if (!allocation) throw new NotFoundError(`Bed allocation ${id} not found`)
    if (allocation.status === 'vacated') throw new ConflictError(`Bed allocation ${id} is already vacated`)
    return boardingRepository.vacate(id, vacatedDate)
  },

  listAttendanceByStudent: (studentId: number) => boardingRepository.findAttendanceByStudent(studentId),

  /** Unlike day attendance, an unexplained boarding absence is a genuine
   *  safety concern, so it triggers an immediate guardian alert. */
  async markAttendance(input: MarkBoardingAttendanceInput) {
    const record = await boardingRepository.upsertAttendance(input)

    if (input.status === 'absent') {
      const student = await studentsRepository.findById(input.studentId)
      if (student) {
        await guardiansService.notifyGuardians(input.studentId, {
          channel: 'sms',
          body: `Dear Parent/Guardian, ${student.firstName} ${student.lastName} was marked ABSENT from the dormitory on ${input.attendanceDate}. Please contact the school urgently if you are not aware of their whereabouts.`,
          relatedEntityType: 'boarding_attendance',
          relatedEntityId: String(record.id),
          createdBy: input.recordedBy,
        })
      }
    }

    return record
  },

  async markAttendanceBulk(records: MarkBoardingAttendanceInput[]) {
    const results = []
    for (const record of records) results.push(await this.markAttendance(record))
    return results
  },
}
