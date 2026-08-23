import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { examResults, exams, gradingBands, gradingScales, subjects } from '../../db/schema/index.js';
export const examsRepository = {
    findAllScales: () => db.select().from(gradingScales),
    findScaleById: (id) => db.select().from(gradingScales).where(eq(gradingScales.id, id)).then((rows) => rows[0]),
    findBandsForScale: (gradingScaleId) => db.select().from(gradingBands).where(eq(gradingBands.gradingScaleId, gradingScaleId)),
    async createScale(data, bands) {
        return db.transaction(async (tx) => {
            const [scale] = await tx.insert(gradingScales).values(data).returning();
            await tx.insert(gradingBands).values(bands.map((band) => ({ ...band, gradingScaleId: scale.id })));
            return scale;
        });
    },
    findAllExams: () => db.select().from(exams),
    findExamById: (id) => db.select().from(exams).where(eq(exams.id, id)).then((rows) => rows[0]),
    createExam: (data) => db.insert(exams).values(data).returning().then((rows) => rows[0]),
    updateExamStatus: (id, status) => db.update(exams).set({ status }).where(eq(exams.id, id)).returning().then((rows) => rows[0]),
    upsertResult: (data) => db
        .insert(examResults)
        .values(data)
        .onConflictDoUpdate({
        target: [examResults.examId, examResults.studentId, examResults.subjectId],
        set: { marks: data.marks, maxMarks: data.maxMarks, grade: data.grade, points: data.points, remarks: data.remarks, enteredBy: data.enteredBy, enteredAt: new Date() },
    })
        .returning()
        .then((rows) => rows[0]),
    findResultsByExamAndStudent: (examId, studentId) => db
        .select({ result: examResults, subjectCode: subjects.code, subjectName: subjects.name })
        .from(examResults)
        .innerJoin(subjects, eq(examResults.subjectId, subjects.id))
        .where(and(eq(examResults.examId, examId), eq(examResults.studentId, studentId))),
    findResultsByExam: (examId) => db.select().from(examResults).where(eq(examResults.examId, examId)),
};
