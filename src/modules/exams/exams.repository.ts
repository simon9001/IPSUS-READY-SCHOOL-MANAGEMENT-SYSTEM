import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { examResults, examStrandResults, examTimetableEntries, exams, gradingBands, gradingScales, subjectStrands, subjects } from '../../db/schema/index.js'
import type { NewExam, NewExamResult, NewExamStrandResult, NewExamTimetableEntry, NewGradingBand, NewGradingScale } from './exams.types.js'

export const examsRepository = {
  findAllScales: () => db.select().from(gradingScales),
  findScaleById: (id: number) =>
    db.select().from(gradingScales).where(eq(gradingScales.id, id)).then((rows) => rows[0]),
  findBandsForScale: (gradingScaleId: number) =>
    db.select().from(gradingBands).where(eq(gradingBands.gradingScaleId, gradingScaleId)),
  async createScale(data: NewGradingScale, bands: Omit<NewGradingBand, 'gradingScaleId'>[]) {
    return db.transaction(async (tx) => {
      const [scale] = await tx.insert(gradingScales).values(data).returning()
      await tx.insert(gradingBands).values(bands.map((band) => ({ ...band, gradingScaleId: scale.id })))
      return scale
    })
  },

  findAllExams: () => db.select().from(exams),
  findExamById: (id: number) =>
    db.select().from(exams).where(eq(exams.id, id)).then((rows) => rows[0]),
  createExam: (data: NewExam) => db.insert(exams).values(data).returning().then((rows) => rows[0]),
  updateExamStatus: (id: number, status: 'marks_entry' | 'completed' | 'published') =>
    db.update(exams).set({ status }).where(eq(exams.id, id)).returning().then((rows) => rows[0]),

  upsertResult: (data: NewExamResult) =>
    db
      .insert(examResults)
      .values(data)
      .onConflictDoUpdate({
        target: [examResults.examId, examResults.studentId, examResults.subjectId],
        set: { marks: data.marks, maxMarks: data.maxMarks, grade: data.grade, points: data.points, remarks: data.remarks, enteredBy: data.enteredBy, enteredAt: new Date() },
      })
      .returning()
      .then((rows) => rows[0]),

  findResultsByExamAndStudent: (examId: number, studentId: number) =>
    db
      .select({ result: examResults, subjectCode: subjects.code, subjectName: subjects.name })
      .from(examResults)
      .innerJoin(subjects, eq(examResults.subjectId, subjects.id))
      .where(and(eq(examResults.examId, examId), eq(examResults.studentId, studentId))),

  findResultsByExam: (examId: number) => db.select().from(examResults).where(eq(examResults.examId, examId)),

  findAllResultsByStudent: (studentId: number) =>
    db
      .select({ result: examResults, examName: exams.name, subjectCode: subjects.code, subjectName: subjects.name })
      .from(examResults)
      .innerJoin(exams, eq(examResults.examId, exams.id))
      .innerJoin(subjects, eq(examResults.subjectId, subjects.id))
      .where(eq(examResults.studentId, studentId)),

  upsertStrandResult: (data: NewExamStrandResult) =>
    db
      .insert(examStrandResults)
      .values(data)
      .onConflictDoUpdate({
        target: [examStrandResults.examId, examStrandResults.studentId, examStrandResults.strandId],
        set: { marks: data.marks, maxMarks: data.maxMarks, grade: data.grade, points: data.points, remarks: data.remarks, enteredBy: data.enteredBy, enteredAt: new Date() },
      })
      .returning()
      .then((rows) => rows[0]),

  findStrandResultsByExamAndStudent: (examId: number, studentId: number) =>
    db
      .select({ result: examStrandResults, strandName: subjectStrands.name, subjectId: subjectStrands.subjectId })
      .from(examStrandResults)
      .innerJoin(subjectStrands, eq(examStrandResults.strandId, subjectStrands.id))
      .where(and(eq(examStrandResults.examId, examId), eq(examStrandResults.studentId, studentId))),

  findTimetableByExam: (examId: number) => db.select().from(examTimetableEntries).where(eq(examTimetableEntries.examId, examId)),
  addTimetableEntry: (data: NewExamTimetableEntry) =>
    db.insert(examTimetableEntries).values(data).returning().then((rows) => rows[0]),

  findLatestPublished: () =>
    db
      .select()
      .from(exams)
      .where(eq(exams.status, 'published'))
      .orderBy(desc(exams.examDate))
      .limit(1)
      .then((rows) => rows[0]),

  /**
   * Ordered pedagogically, not alphabetically: `grade` is free text, so sorting
   * on it puts B before B+ at every letter boundary on a KCSE-style scale and
   * reduces a CBC rubric to "Approaching, Below, Exceeds, Meets". A grade
   * distribution IS its shape, so that ordering destroys the chart.
   *
   * The exam's own grading scale supplies the order, via the band whose grade
   * matches. LEFT join, so a result whose grade matches no band (a renamed band,
   * or marks entered before the scale was applied) is still returned and still
   * counted — dropping it would make the chart disagree with the exam — and
   * sorts last via `nulls last`. count(distinct) rather than count(*) so the
   * count survives a scale that somehow holds two bands with the same grade.
   */
  countResultsByGrade: (examId: number) =>
    db
      .select({ grade: examResults.grade, count: sql<number>`count(distinct ${examResults.id})::int` })
      .from(examResults)
      .innerJoin(exams, eq(examResults.examId, exams.id))
      .leftJoin(
        gradingBands,
        and(eq(gradingBands.gradingScaleId, exams.gradingScaleId), eq(gradingBands.grade, examResults.grade)),
      )
      .where(eq(examResults.examId, examId))
      .groupBy(examResults.grade)
      .orderBy(sql`max(${gradingBands.minMarks}) desc nulls last`),
}
