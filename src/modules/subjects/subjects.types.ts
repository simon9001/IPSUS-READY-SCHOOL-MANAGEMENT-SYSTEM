import type { subjects, classSubjects, teacherAssignments } from '../../db/schema/index.js'

export type Subject = typeof subjects.$inferSelect
export type NewSubject = typeof subjects.$inferInsert
export type ClassSubject = typeof classSubjects.$inferSelect
export type NewClassSubject = typeof classSubjects.$inferInsert
export type TeacherAssignment = typeof teacherAssignments.$inferSelect
export type NewTeacherAssignment = typeof teacherAssignments.$inferInsert
