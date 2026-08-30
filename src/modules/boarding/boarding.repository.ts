import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { bedAllocations, boardingAttendance, dormitories, students } from '../../db/schema/index.js'
import type { NewBedAllocation, NewBoardingAttendance, NewDormitory } from './boarding.types.js'

export const boardingRepository = {
  findAllDormitories: () => db.select().from(dormitories),
  findDormitoryById: (id: number) =>
    db.select().from(dormitories).where(eq(dormitories.id, id)).then((rows) => rows[0]),
  createDormitory: (data: NewDormitory) => db.insert(dormitories).values(data).returning().then((rows) => rows[0]),

  async activeOccupancy(dormitoryId: number) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bedAllocations)
      .where(and(eq(bedAllocations.dormitoryId, dormitoryId), eq(bedAllocations.status, 'active')))
    return row?.count ?? 0
  },

  async countActiveAllocations() {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bedAllocations)
      .where(eq(bedAllocations.status, 'active'))
    return row?.count ?? 0
  },

  findBedOccupant: (dormitoryId: number, bedNumber: string) =>
    db
      .select()
      .from(bedAllocations)
      .where(and(eq(bedAllocations.dormitoryId, dormitoryId), eq(bedAllocations.bedNumber, bedNumber), eq(bedAllocations.status, 'active')))
      .then((rows) => rows[0]),

  findActiveAllocationForStudent: (studentId: number) =>
    db
      .select()
      .from(bedAllocations)
      .where(and(eq(bedAllocations.studentId, studentId), eq(bedAllocations.status, 'active')))
      .then((rows) => rows[0]),

  findAllocationsByDormitory: (dormitoryId: number) => db.select().from(bedAllocations).where(eq(bedAllocations.dormitoryId, dormitoryId)),
  findAllocationById: (id: number) =>
    db.select().from(bedAllocations).where(eq(bedAllocations.id, id)).then((rows) => rows[0]),
  createAllocation: (data: NewBedAllocation) => db.insert(bedAllocations).values(data).returning().then((rows) => rows[0]),
  vacate: (id: number, vacatedDate: string) =>
    db.update(bedAllocations).set({ status: 'vacated', vacatedDate }).where(eq(bedAllocations.id, id)).returning().then((rows) => rows[0]),

  findAttendanceByStudent: (studentId: number) => db.select().from(boardingAttendance).where(eq(boardingAttendance.studentId, studentId)),
  upsertAttendance: (data: NewBoardingAttendance) =>
    db
      .insert(boardingAttendance)
      .values(data)
      .onConflictDoUpdate({
        target: [boardingAttendance.studentId, boardingAttendance.attendanceDate],
        set: { status: data.status, remarks: data.remarks, recordedBy: data.recordedBy },
      })
      .returning()
      .then((rows) => rows[0]),

  findStudentBoardingStatus: (studentId: number) =>
    db.select({ boardingStatus: students.boardingStatus }).from(students).where(eq(students.id, studentId)).then((rows) => rows[0]),
}
