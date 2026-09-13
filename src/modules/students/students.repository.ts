import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { admissions, classes, streams, students } from '../../db/schema/index.js'
import type { NewClass, NewStream, NewStudent } from './students.types.js'

export const studentsRepository = {
  findAllClasses: () => db.select().from(classes).orderBy(classes.level),
  createClass: (data: NewClass) => db.insert(classes).values(data).returning().then((rows) => rows[0]),

  findStreamsByClass: (classId: number) => db.select().from(streams).where(eq(streams.classId, classId)),
  createStream: (data: NewStream) => db.insert(streams).values(data).returning().then((rows) => rows[0]),

  findAll: () => db.select().from(students),
  findById: (id: number) =>
    db.select().from(students).where(eq(students.id, id)).then((rows) => rows[0]),
  findByAdmissionNo: (admissionNo: string) =>
    db.select().from(students).where(eq(students.admissionNo, admissionNo)).then((rows) => rows[0]),
  findByClass: (classId: number) => db.select().from(students).where(eq(students.classId, classId)),

  create: (data: NewStudent) => db.insert(students).values(data).returning().then((rows) => rows[0]),
  update: (id: number, data: Partial<NewStudent>) =>
    db
      .update(students)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning()
      .then((rows) => rows[0]),
  /**
   * One transaction. An enrolled student is always referenced by the admission
   * that created them, so that link is cleared and the admission returned to
   * 'admitted', ready to be enrolled again correctly. If any other table still
   * references the student, Postgres refuses the delete and the unlink rolls
   * back with it.
   */
  removeWithAdmissionUnlink: (id: number) =>
    db.transaction(async (tx) => {
      await tx.update(admissions).set({ studentId: null, status: 'admitted', enrolledAt: null }).where(eq(admissions.studentId, id))
      return tx.delete(students).where(eq(students.id, id)).returning().then((rows) => rows[0])
    }),
}
