import type { documentTemplates, generatedDocuments } from '../../db/schema/index.js'

export type DocumentTemplate = typeof documentTemplates.$inferSelect
export type NewDocumentTemplate = typeof documentTemplates.$inferInsert
export type GeneratedDocument = typeof generatedDocuments.$inferSelect
export type NewGeneratedDocument = typeof generatedDocuments.$inferInsert

export interface TranscriptSubjectRow {
  examName: string
  subjectCode: string
  subjectName: string
  marks: number
  grade: string | null
}

export interface Transcript {
  studentId: number
  studentName: string
  admissionNo: string
  entries: TranscriptSubjectRow[]
}
