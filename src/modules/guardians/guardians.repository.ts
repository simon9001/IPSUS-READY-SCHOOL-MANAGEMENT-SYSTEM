import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { guardianStudents, students } from '../../db/schema/index.js'
import type { NewGuardianStudent } from './guardians.types.js'

export const guardiansRepository = {
  findStudentsByGuardian: (userId: number) =>
    db
      .select({ link: guardianStudents, student: students })
      .from(guardianStudents)
      .innerJoin(students, eq(guardianStudents.studentId, students.id))
      .where(eq(guardianStudents.userId, userId)),

  findLink: (userId: number, studentId: number) =>
    db
      .select()
      .from(guardianStudents)
      .where(and(eq(guardianStudents.userId, userId), eq(guardianStudents.studentId, studentId)))
      .then((rows) => rows[0]),

  findGuardiansByStudent: (studentId: number) => db.select().from(guardianStudents).where(eq(guardianStudents.studentId, studentId)),

  link: (data: NewGuardianStudent) => db.insert(guardianStudents).values(data).returning().then((rows) => rows[0]),
}
