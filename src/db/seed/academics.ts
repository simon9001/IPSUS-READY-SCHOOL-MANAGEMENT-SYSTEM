import { subjectsService } from '../../modules/subjects/subjects.service.js'
import { timetableService } from '../../modules/timetable/timetable.service.js'
import { SUBJECTS, STRANDS, TEACHERS, LESSON_PERIODS, WEEKDAYS } from './data.js'
import type { ReferenceDataSeed } from './reference.js'
import type { PeopleSeed } from './people.js'

export async function seedAcademics({ P1, P2, P3, classes, teacherByStaffNo }: ReferenceDataSeed & PeopleSeed) {
  // --- Subjects, strands, class offerings, teacher assignments ----------------
  console.log('Subjects, CBC strands, offerings and assignments...')
  const subjectByCode = new Map<string, number>()
  for (const s of SUBJECTS) {
    const subject = await subjectsService.create(s)
    subjectByCode.set(s.code, subject.id)
  }

  let strandCount = 0
  for (const [code, names] of Object.entries(STRANDS)) {
    for (const name of names) {
      await subjectsService.createStrand({ subjectId: subjectByCode.get(code)!, name })
      strandCount++
    }
  }

  // Forms 1-2 take the full compulsory set plus the sciences and humanities;
  // Forms 3-4 drop to a narrower KCSE selection, which is what actually happens
  // after subject selection at the end of Form 2.
  const JUNIOR_SUBJECTS = ['MAT', 'ENG', 'KIS', 'BIO', 'CHE', 'PHY', 'HIS', 'GEO', 'CRE', 'AGR']
  const SENIOR_SUBJECTS = ['MAT', 'ENG', 'KIS', 'BIO', 'CHE', 'PHY', 'GEO', 'BST']

  const subjectsForClass = (level: number) => (level <= 2 ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS)

  // teacherFor: which teacher teaches a given subject to a given class. Round
  // robins between the teachers qualified for that subject so no one person
  // ends up owning every class of it.
  const teachersBySubject = new Map<string, number[]>()
  for (const t of TEACHERS) {
    for (const code of t.subjects) {
      const list = teachersBySubject.get(code) ?? []
      list.push(teacherByStaffNo.get(t.staffNo)!)
      teachersBySubject.set(code, list)
    }
  }
  const teacherFor = (code: string, level: number) => {
    const candidates = teachersBySubject.get(code)
    if (!candidates || candidates.length === 0) return teacherByStaffNo.get(TEACHERS[0].staffNo)!
    return candidates[(level - 1) % candidates.length]
  }

  let offerings = 0
  let assignments = 0
  for (const cls of classes) {
    for (const code of subjectsForClass(cls.level)) {
      await subjectsService.offerToClass({ classId: cls.id, subjectId: subjectByCode.get(code)! })
      offerings++
      for (const periodId of [P1, P2, P3]) {
        await subjectsService.assignTeacher({
          teacherId: teacherFor(code, cls.level),
          subjectId: subjectByCode.get(code)!,
          classId: cls.id,
          periodId,
        })
        assignments++
      }
    }
  }
  console.log(`  ${SUBJECTS.length} subjects, ${strandCount} CBC strands, ${offerings} class offerings, ${assignments} teacher assignments`)

  // --- Timetable -------------------------------------------------------------
  console.log('Class timetable for Term 3...')
  const lessonPeriodIds: number[] = []
  for (const lp of LESSON_PERIODS) {
    const created = await timetableService.createLessonPeriod(lp)
    lessonPeriodIds.push(created.id)
  }

  // The service rejects double-booking a class OR a teacher in the same slot,
  // so occupancy is tracked here and a busy teacher's subject is rotated past
  // rather than relying on catching the resulting ConflictError.
  const teacherBusy = new Set<string>()
  let timetableEntries = 0

  for (const cls of classes) {
    const codes = subjectsForClass(cls.level)
    let rotation = cls.level * 3
    for (const day of WEEKDAYS) {
      for (const lessonPeriodId of lessonPeriodIds) {
        let placed = false
        for (let attempt = 0; attempt < codes.length && !placed; attempt++) {
          const code = codes[(rotation + attempt) % codes.length]
          const teacherId = teacherFor(code, cls.level)
          const slotKey = `${teacherId}|${day}|${lessonPeriodId}`
          if (teacherBusy.has(slotKey)) continue

          await timetableService.createEntry({
            classId: cls.id,
            subjectId: subjectByCode.get(code)!,
            teacherId,
            lessonPeriodId,
            dayOfWeek: day,
            periodId: P3,
          })
          teacherBusy.add(slotKey)
          timetableEntries++
          placed = true
        }
        rotation++
      }
    }
  }
  console.log(`  ${LESSON_PERIODS.length} lesson periods, ${timetableEntries} timetable entries`)

  return { subjectByCode, subjectsForClass }
}

export type AcademicsSeed = Awaited<ReturnType<typeof seedAcademics>>
