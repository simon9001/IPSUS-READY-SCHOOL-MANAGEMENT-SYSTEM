import { studentsService } from '../../students/students.service.js'
import { examsService } from '../../exams/exams.service.js'
import { admissionsService } from '../../admissions/admissions.service.js'
import { timetableService } from '../../timetable/timetable.service.js'
import { libraryService } from '../../library/library.service.js'
import { disciplineService } from '../../discipline/discipline.service.js'
import { conductPointsService } from '../../conductPoints/conductPoints.service.js'
import { disciplinaryCasesService } from '../../disciplinaryCases/disciplinaryCases.service.js'
import type { WidgetDef } from './shared.js'

export const STUDENTS_WIDGETS: WidgetDef[] = [
  {
    id: 'enrollment',
    section: 'students',
    requiredPermission: 'students.view',
    async build() {
      const [students, classes] = await Promise.all([studentsService.list(), studentsService.listClasses()])
      const active = students.filter((s) => s.status === 'active')
      const classNameById = new Map(classes.map((c) => [c.id, c.name]))
      const byClass = new Map<number, number>()
      for (const s of active) byClass.set(s.classId, (byClass.get(s.classId) ?? 0) + 1)
      return {
        id: 'enrollment',
        title: 'Enrollment',
        kind: 'stats',
        stats: [
          { label: 'Active Students', value: String(active.length) },
          ...[...byClass.entries()]
            .slice(0, 5)
            .map(([classId, count]) => ({ label: classNameById.get(classId) ?? `Class #${classId}`, value: String(count) })),
        ],
      }
    },
  },
  {
    id: 'academic-snapshot',
    section: 'students',
    requiredPermission: 'exams.view',
    async build() {
      const exams = await examsService.listExams()
      const sorted = [...exams].sort((a, b) => b.id - a.id)
      let mostRecent: { name: string; mean: number } | null = null
      for (const exam of sorted) {
        const results = await examsService.getResultsForExam(exam.id)
        if (results.length > 0) {
          const mean = results.reduce((sum, r) => sum + Number(r.marks), 0) / results.length
          mostRecent = { name: exam.name, mean: Math.round(mean * 10) / 10 }
          break
        }
      }
      return {
        id: 'academic-snapshot',
        title: 'Academic',
        kind: 'stats',
        stats: [
          { label: 'Exams Recorded', value: String(exams.length) },
          { label: 'Most Recent Exam', value: mostRecent ? `${mostRecent.name} — mean ${mostRecent.mean}` : 'No results yet' },
        ],
      }
    },
  },
  {
    id: 'admissions-pipeline',
    section: 'students',
    requiredPermission: 'admissions.view',
    async build() {
      const admissions = await admissionsService.list()
      const byStatus = new Map<string, number>()
      for (const a of admissions) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1)
      return {
        id: 'admissions-pipeline',
        title: 'Admissions Pipeline',
        kind: 'stats',
        stats: [...byStatus.entries()].map(([status, count]) => ({
          label: status.replace(/_/g, ' '),
          value: String(count),
          tone: status === 'pending' || status === 'interview_scheduled' ? 'warning' : 'default',
        })),
      }
    },
  },
  {
    id: 'timetable-status',
    section: 'students',
    requiredPermission: 'timetable.view',
    async build() {
      const periods = await timetableService.listLessonPeriods()
      return {
        id: 'timetable-status',
        title: 'Timetable',
        kind: 'stats',
        stats: [{ label: 'Lesson Periods Configured', value: String(periods.length) }],
      }
    },
  },
  {
    id: 'library-overview',
    section: 'students',
    requiredPermission: 'library.view',
    async build() {
      const books = await libraryService.listBooks()
      return {
        id: 'library-overview',
        title: 'Library',
        kind: 'stats',
        stats: [
          { label: 'Titles in Catalog', value: String(books.length) },
          { label: 'Total Copies', value: String(books.reduce((sum, b) => sum + b.totalCopies, 0)) },
        ],
      }
    },
  },
  {
    id: 'student-conduct',
    section: 'students',
    requiredPermission: ['discipline.view', 'conduct_points.view'],
    async build({ permissions }) {
      const stats: { label: string; value: string; tone?: 'warning' }[] = []
      if (permissions.includes('discipline.view')) {
        const recent = await disciplineService.listRecent(20)
        stats.push({ label: 'Discipline Records (recent)', value: String(recent.length) })
      }
      if (permissions.includes('conduct_points.view')) {
        const recent = await conductPointsService.listRecent(20)
        stats.push({ label: 'Conduct Points Awarded (recent)', value: String(recent.length) })
      }
      return { id: 'student-conduct', title: 'Student Conduct', kind: 'stats', stats }
    },
  },
  {
    id: 'disciplinary-cases-overview',
    section: 'students',
    requiredPermission: 'disciplinary_cases.view',
    async build() {
      const cases = await disciplinaryCasesService.list()
      const byStatus = new Map<string, number>()
      for (const c of cases) byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + 1)
      return {
        id: 'disciplinary-cases-overview',
        title: 'Disciplinary Cases',
        kind: 'stats',
        stats: [
          { label: 'Total Cases', value: String(cases.length) },
          ...[...byStatus.entries()].map(([status, count]) => ({ label: status.replace(/_/g, ' '), value: String(count) })),
        ],
      }
    },
  },
]
