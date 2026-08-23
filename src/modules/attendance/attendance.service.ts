import { attendanceRepository } from './attendance.repository.js'
import type { MarkAttendanceInput } from './attendance.schema.js'

export const attendanceService = {
  listByStudent: (studentId: number) => attendanceRepository.findByStudent(studentId),

  listByClassAndDate: (classId: number, attendanceDate: string) =>
    attendanceRepository.findByClassAndDate(classId, attendanceDate),

  mark: (input: MarkAttendanceInput) => attendanceRepository.upsert(input),

  async markBulk(records: MarkAttendanceInput[]) {
    const results = []
    for (const record of records) {
      results.push(await attendanceRepository.upsert(record))
    }
    return results
  },
}
