import { examsRepository } from './exams.repository.js';
import { NotFoundError } from '../../common/errors.js';
function findBand(bands, percentage) {
    return bands.find((b) => percentage >= Number(b.minMarks) && percentage <= Number(b.maxMarks));
}
export const examsService = {
    listScales: () => examsRepository.findAllScales(),
    async getScaleById(id) {
        const scale = await examsRepository.findScaleById(id);
        if (!scale)
            throw new NotFoundError(`Grading scale ${id} not found`);
        const bands = await examsRepository.findBandsForScale(id);
        return { ...scale, bands };
    },
    createScale: (input) => {
        const { bands, ...scale } = input;
        return examsRepository.createScale(scale, bands.map((b) => ({ minMarks: String(b.minMarks), maxMarks: String(b.maxMarks), grade: b.grade, points: b.points !== undefined ? String(b.points) : undefined })));
    },
    listExams: () => examsRepository.findAllExams(),
    async getExamById(id) {
        const exam = await examsRepository.findExamById(id);
        if (!exam)
            throw new NotFoundError(`Exam ${id} not found`);
        return exam;
    },
    createExam: (input) => examsRepository.createExam(input),
    async recordResult(input) {
        const exam = await examsRepository.findExamById(input.examId);
        if (!exam)
            throw new NotFoundError(`Exam ${input.examId} not found`);
        const bands = await examsRepository.findBandsForScale(exam.gradingScaleId);
        const percentage = (Number(input.marks) / Number(input.maxMarks)) * 100;
        const band = findBand(bands, percentage);
        return examsRepository.upsertResult({
            examId: input.examId,
            studentId: input.studentId,
            subjectId: input.subjectId,
            marks: String(input.marks),
            maxMarks: String(input.maxMarks),
            grade: band?.grade ?? null,
            points: band?.points ?? null,
            remarks: input.remarks,
            enteredBy: input.enteredBy,
        });
    },
    async bulkRecordResults(results) {
        const recorded = [];
        for (const result of results) {
            recorded.push(await this.recordResult(result));
        }
        return recorded;
    },
    async reportCard(examId, studentId) {
        const exam = await examsRepository.findExamById(examId);
        if (!exam)
            throw new NotFoundError(`Exam ${examId} not found`);
        const rows = await examsRepository.findResultsByExamAndStudent(examId, studentId);
        if (rows.length === 0)
            throw new NotFoundError(`No results recorded for student ${studentId} in exam ${examId}`);
        const bands = await examsRepository.findBandsForScale(exam.gradingScaleId);
        const subjectRows = rows.map((r) => ({
            subjectId: r.result.subjectId,
            subjectCode: r.subjectCode,
            subjectName: r.subjectName,
            marks: Number(r.result.marks),
            grade: r.result.grade,
            points: r.result.points !== null ? Number(r.result.points) : null,
        }));
        const totalMarks = subjectRows.reduce((sum, s) => sum + s.marks, 0);
        const meanMarks = totalMarks / subjectRows.length;
        const meanBand = findBand(bands, meanMarks);
        const allResults = await examsRepository.findResultsByExam(examId);
        const totalsByStudent = new Map();
        for (const r of allResults)
            totalsByStudent.set(r.studentId, (totalsByStudent.get(r.studentId) ?? 0) + Number(r.marks));
        const ranked = [...totalsByStudent.entries()].sort((a, b) => b[1] - a[1]);
        const classPosition = ranked.findIndex(([sid]) => sid === studentId) + 1;
        return {
            examId,
            studentId,
            subjects: subjectRows,
            totalMarks,
            meanMarks,
            meanGrade: meanBand?.grade ?? null,
            classPosition: classPosition || null,
            classSize: ranked.length,
        };
    },
};
