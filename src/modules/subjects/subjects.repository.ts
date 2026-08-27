import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { classSubjects, subjects, subjectStrands, teacherAssignments } from '../../db/schema/index.js'
import type { NewClassSubject, NewSubject, NewSubjectStrand, NewTeacherAssignment } from './subjects.types.js'

export const subjectsRepository = {
  findAll: () => db.select().from(subjects),
  findById: (id: number) =>
    db.select().from(subjects).where(eq(subjects.id, id)).then((rows) => rows[0]),
  findByCode: (code: string) =>
    db.select().from(subjects).where(eq(subjects.code, code)).then((rows) => rows[0]),
  create: (data: NewSubject) => db.insert(subjects).values(data).returning().then((rows) => rows[0]),

  findStrandsBySubject: (subjectId: number) => db.select().from(subjectStrands).where(eq(subjectStrands.subjectId, subjectId)),
  findStrandByName: (subjectId: number, name: string) =>
    db.select().from(subjectStrands).where(and(eq(subjectStrands.subjectId, subjectId), eq(subjectStrands.name, name))).then((rows) => rows[0]),
  createStrand: (data: NewSubjectStrand) => db.insert(subjectStrands).values(data).returning().then((rows) => rows[0]),

  findOfferingsByClass: (classId: number) => db.select().from(classSubjects).where(eq(classSubjects.classId, classId)),
  findOffering: (classId: number, subjectId: number) =>
    db
      .select()
      .from(classSubjects)
      .where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId)))
      .then((rows) => rows[0]),
  offerToClass: (data: NewClassSubject) => db.insert(classSubjects).values(data).returning().then((rows) => rows[0]),

  findAssignments: (classId: number, periodId: number) =>
    db.select().from(teacherAssignments).where(and(eq(teacherAssignments.classId, classId), eq(teacherAssignments.periodId, periodId))),
  assignTeacher: (data: NewTeacherAssignment) =>
    db.insert(teacherAssignments).values(data).returning().then((rows) => rows[0]),
}
