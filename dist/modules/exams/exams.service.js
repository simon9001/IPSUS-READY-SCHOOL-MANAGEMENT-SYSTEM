import { examsRepository } from './exams.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
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
    getTimetable: (examId) => examsRepository.findTimetableByExam(examId),
    async addTimetableEntry(input) {
        await this.getExamById(input.examId);
        const existing = (await examsRepository.findTimetableByExam(input.examId)).find((e) => e.subjectId === input.subjectId);
        if (existing)
            throw new ConflictError('This subject already has a sitting scheduled for this exam');
        return examsRepository.addTimetableEntry(input);
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
    /** CBC strand-level entry: bands a numeric mark same as recordResult, or
     *  stores a directly-assigned rubric grade (e.g. "Meets Expectation") when
     *  no mark is given — the strand has no marks-mandatory assumption. */
    async recordStrandResult(input) {
        const exam = await examsRepository.findExamById(input.examId);
        if (!exam)
            throw new NotFoundError(`Exam ${input.examId} not found`);
        let grade = input.grade ?? null;
        let points = null;
        if (input.marks !== undefined) {
            const bands = await examsRepository.findBandsForScale(exam.gradingScaleId);
            const percentage = (Number(input.marks) / Number(input.maxMarks)) * 100;
            const band = findBand(bands, percentage);
            grade = input.grade ?? band?.grade ?? null;
            points = band?.points ?? null;
        }
        return examsRepository.upsertStrandResult({
            examId: input.examId,
            studentId: input.studentId,
            strandId: input.strandId,
            marks: input.marks !== undefined ? String(input.marks) : undefined,
            maxMarks: String(input.maxMarks),
            grade,
            points,
            remarks: input.remarks,
            enteredBy: input.enteredBy,
        });
    },
    getStrandResults: (examId, studentId) => examsRepository.findStrandResultsByExamAndStudent(examId, studentId),
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
    getAllResultsForStudent: (studentId) => examsRepository.findAllResultsByStudent(studentId),
    getResultsForExam: (examId) => examsRepository.findResultsByExam(examId),
};
