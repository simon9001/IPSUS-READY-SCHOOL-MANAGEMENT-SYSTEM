import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { attendanceRecords, students } from '../../db/schema/index.js'
import type { NewAttendanceRecord } from './attendance.types.js'

export const attendanceRepository = {
  findByStudent: (studentId: number) => db.select().from(attendanceRecords).where(eq(attendanceRecords.studentId, studentId)),

  findByClassAndDate: (classId: number, attendanceDate: string) =>
    db
      .select({ record: attendanceRecords })
      .from(attendanceRecords)
      .innerJoin(students, eq(attendanceRecords.studentId, students.id))
      .where(and(eq(students.classId, classId), eq(attendanceRecords.attendanceDate, attendanceDate))),

  upsert: (data: NewAttendanceRecord) =>
    db
      .insert(attendanceRecords)
      .values(data)
      .onConflictDoUpdate({
        target: [attendanceRecords.studentId, attendanceRecords.attendanceDate],
        set: { status: data.status, remarks: data.remarks, recordedBy: data.recordedBy },
      })
      .returning()
      .then((rows) => rows[0]),
}
