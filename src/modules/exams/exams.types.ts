import type { gradingScales, gradingBands, exams, examResults, examStrandResults, examTimetableEntries } from '../../db/schema/index.js'

export type GradingScale = typeof gradingScales.$inferSelect
export type NewGradingScale = typeof gradingScales.$inferInsert
export type GradingBand = typeof gradingBands.$inferSelect
export type NewGradingBand = typeof gradingBands.$inferInsert
export type Exam = typeof exams.$inferSelect
export type NewExam = typeof exams.$inferInsert
export type ExamResult = typeof examResults.$inferSelect
export type NewExamResult = typeof examResults.$inferInsert
export type ExamStrandResult = typeof examStrandResults.$inferSelect
export type NewExamStrandResult = typeof examStrandResults.$inferInsert
export type ExamTimetableEntry = typeof examTimetableEntries.$inferSelect
export type NewExamTimetableEntry = typeof examTimetableEntries.$inferInsert

export interface ReportCardSubjectRow {
  subjectId: number
  subjectCode: string
  subjectName: string
  marks: number
  grade: string | null
  points: number | null
}

export interface ReportCard {
  examId: number
  studentId: number
  subjects: ReportCardSubjectRow[]
  totalMarks: number
  meanMarks: number
  meanGrade: string | null
  classPosition: number | null
  classSize: number | null
}
