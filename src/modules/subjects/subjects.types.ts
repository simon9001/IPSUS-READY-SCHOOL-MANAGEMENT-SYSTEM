import type { subjects, subjectStrands, classSubjects, teacherAssignments } from '../../db/schema/index.js'

export type Subject = typeof subjects.$inferSelect
export type NewSubject = typeof subjects.$inferInsert
export type SubjectStrand = typeof subjectStrands.$inferSelect
export type NewSubjectStrand = typeof subjectStrands.$inferInsert
export type ClassSubject = typeof classSubjects.$inferSelect
export type NewClassSubject = typeof classSubjects.$inferInsert
export type TeacherAssignment = typeof teacherAssignments.$inferSelect
export type NewTeacherAssignment = typeof teacherAssignments.$inferInsert
