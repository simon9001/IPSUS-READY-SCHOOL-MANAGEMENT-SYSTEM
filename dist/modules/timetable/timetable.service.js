import { timetableRepository } from './timetable.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const timetableService = {
    listLessonPeriods: () => timetableRepository.findAllLessonPeriods(),
    createLessonPeriod: (input) => timetableRepository.createLessonPeriod(input),
    getClassTimetable: (classId, periodId) => timetableRepository.findByClass(classId, periodId),
    getTeacherTimetable: (teacherId, periodId) => timetableRepository.findByTeacher(teacherId, periodId),
    async createEntry(input) {
        const classConflict = await timetableRepository.findClassSlotConflict(input.classId, input.streamId, input.dayOfWeek, input.lessonPeriodId, input.periodId);
        if (classConflict)
            throw new ConflictError('This class/stream already has a lesson scheduled in that day/period slot');
        const teacherConflict = await timetableRepository.findTeacherSlotConflict(input.teacherId, input.dayOfWeek, input.lessonPeriodId, input.periodId);
        if (teacherConflict)
            throw new ConflictError('This teacher is already scheduled elsewhere in that day/period slot');
        return timetableRepository.create(input);
    },
    async deleteEntry(id) {
        const entry = await timetableRepository.findById(id);
        if (!entry)
            throw new NotFoundError(`Timetable entry ${id} not found`);
        return timetableRepository.delete(id);
    },
    async teacherWorkload(teacherId, periodId) {
        const entries = await timetableRepository.findByTeacher(teacherId, periodId);
        const bySubjectMap = new Map();
        for (const entry of entries)
            bySubjectMap.set(entry.subjectId, (bySubjectMap.get(entry.subjectId) ?? 0) + 1);
        return {
            teacherId,
            periodId,
            totalPeriodsPerWeek: entries.length,
            bySubject: [...bySubjectMap.entries()].map(([subjectId, periodsPerWeek]) => ({ subjectId, periodsPerWeek })),
        };
    },
};
