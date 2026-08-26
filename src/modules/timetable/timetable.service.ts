import { timetableRepository } from './timetable.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { CreateLessonPeriodInput, CreateTimetableEntryInput } from './timetable.schema.js'
import type { TeacherWorkload } from './timetable.types.js'

export const timetableService = {
  listLessonPeriods: () => timetableRepository.findAllLessonPeriods(),
  createLessonPeriod: (input: CreateLessonPeriodInput) => timetableRepository.createLessonPeriod(input),

  getClassTimetable: (classId: number, periodId: number) => timetableRepository.findByClass(classId, periodId),
  getTeacherTimetable: (teacherId: number, periodId: number) => timetableRepository.findByTeacher(teacherId, periodId),

  async createEntry(input: CreateTimetableEntryInput) {
    const classConflict = await timetableRepository.findClassSlotConflict(
      input.classId,
      input.streamId,
      input.dayOfWeek,
      input.lessonPeriodId,
      input.periodId,
    )
    if (classConflict) throw new ConflictError('This class/stream already has a lesson scheduled in that day/period slot')

    const teacherConflict = await timetableRepository.findTeacherSlotConflict(input.teacherId, input.dayOfWeek, input.lessonPeriodId, input.periodId)
    if (teacherConflict) throw new ConflictError('This teacher is already scheduled elsewhere in that day/period slot')

    return timetableRepository.create(input)
  },

  async deleteEntry(id: number) {
    const entry = await timetableRepository.findById(id)
    if (!entry) throw new NotFoundError(`Timetable entry ${id} not found`)
    return timetableRepository.delete(id)
  },

  async teacherWorkload(teacherId: number, periodId: number): Promise<TeacherWorkload> {
    const entries = await timetableRepository.findByTeacher(teacherId, periodId)
    const bySubjectMap = new Map<number, number>()
    for (const entry of entries) bySubjectMap.set(entry.subjectId, (bySubjectMap.get(entry.subjectId) ?? 0) + 1)

    return {
      teacherId,
      periodId,
      totalPeriodsPerWeek: entries.length,
      bySubject: [...bySubjectMap.entries()].map(([subjectId, periodsPerWeek]) => ({ subjectId, periodsPerWeek })),
    }
  },
}
