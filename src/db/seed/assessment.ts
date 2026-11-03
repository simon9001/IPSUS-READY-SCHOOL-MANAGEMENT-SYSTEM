import { examsService } from '../../modules/exams/exams.service.js'
import { attendanceService } from '../../modules/attendance/attendance.service.js'
import { disciplineService } from '../../modules/discipline/discipline.service.js'
import { conductPointsService } from '../../modules/conductPoints/conductPoints.service.js'
import { randInt, pick, chance, tolerate, TERM_2, TERM_3, addDays, schoolDays } from './data.js'
import type { ReferenceDataSeed } from './reference.js'
import type { PeopleSeed } from './people.js'
import type { AcademicsSeed } from './academics.js'

export async function seedAssessment({
  P1,
  P2,
  P3,
  TEACHER_USER,
  classes,
  allStudents,
  subjectByCode,
  subjectsForClass,
}: ReferenceDataSeed & PeopleSeed & AcademicsSeed) {
  // --- Exams and results -----------------------------------------------------
  console.log('Grading scales, exams and results...')
  const kcseScale = await examsService.createScale({
    name: 'KCSE Grading Scale (8-4-4)',
    isDefault: true,
    bands: [
      { minMarks: 80, maxMarks: 100, grade: 'A', points: 12 },
      { minMarks: 75, maxMarks: 79, grade: 'A-', points: 11 },
      { minMarks: 70, maxMarks: 74, grade: 'B+', points: 10 },
      { minMarks: 65, maxMarks: 69, grade: 'B', points: 9 },
      { minMarks: 60, maxMarks: 64, grade: 'B-', points: 8 },
      { minMarks: 55, maxMarks: 59, grade: 'C+', points: 7 },
      { minMarks: 50, maxMarks: 54, grade: 'C', points: 6 },
      { minMarks: 45, maxMarks: 49, grade: 'C-', points: 5 },
      { minMarks: 40, maxMarks: 44, grade: 'D+', points: 4 },
      { minMarks: 35, maxMarks: 39, grade: 'D', points: 3 },
      { minMarks: 30, maxMarks: 34, grade: 'D-', points: 2 },
      { minMarks: 0, maxMarks: 29, grade: 'E', points: 1 },
    ],
  })

  // Proves the dual-mode design: same table, same lookup, CBC rubric bands.
  await examsService.createScale({
    name: 'CBC Competency Rubric',
    isDefault: false,
    bands: [
      { minMarks: 76, maxMarks: 100, grade: 'Exceeds Expectation', points: 4 },
      { minMarks: 51, maxMarks: 75, grade: 'Meets Expectation', points: 3 },
      { minMarks: 26, maxMarks: 50, grade: 'Approaching Expectation', points: 2 },
      { minMarks: 0, maxMarks: 25, grade: 'Below Expectation', points: 1 },
    ],
  })

  // A per-student ability offset so the same learner is consistently strong or
  // weak across subjects and terms — random marks per row would make every
  // report card statistically identical and the mean-score trend meaningless.
  const abilityByStudent = new Map(allStudents.map((s) => [s.id, randInt(-18, 18)]))

  const examPlan = [
    { name: 'Term 1 Opener Examination', periodId: P1, date: '2026-01-29' },
    { name: 'Term 1 End of Term Examination', periodId: P1, date: '2026-03-25' },
    { name: 'Term 2 Mid Term Examination', periodId: P2, date: '2026-06-10' },
    { name: 'Term 2 End of Term Examination', periodId: P2, date: '2026-07-30' },
  ]

  let examCount = 0
  let resultCount = 0
  for (const plan of examPlan) {
    for (const cls of classes) {
      const exam = await examsService.createExam({
        name: `${cls.name} — ${plan.name}`,
        periodId: plan.periodId,
        classId: cls.id,
        gradingScaleId: kcseScale.id,
        examDate: plan.date,
      })
      examCount++

      const codes = subjectsForClass(cls.level)
      const classStudents = allStudents.filter((s) => s.classId === cls.id)
      const results = []

      for (const student of classStudents) {
        const ability = abilityByStudent.get(student.id)!
        for (const code of codes) {
          // Sciences and maths sit a little lower than languages, which is the
          // familiar shape of a Kenyan secondary mark sheet.
          const subjectBias = ['MAT', 'PHY', 'CHE'].includes(code) ? -6 : ['ENG', 'KIS', 'CRE'].includes(code) ? 4 : 0
          const marks = Math.max(8, Math.min(98, 52 + ability + subjectBias + randInt(-10, 10)))
          results.push({
            examId: exam.id,
            studentId: student.id,
            subjectId: subjectByCode.get(code)!,
            marks,
            maxMarks: 100,
            enteredBy: TEACHER_USER,
          })
        }
      }
      // Chunked so a dropped connection costs one chunk rather than a whole
      // class's mark sheet.
      for (let offset = 0; offset < results.length; offset += 40) {
        const chunk = results.slice(offset, offset + 40)
        const written = await tolerate(`${cls.name} ${plan.name} results`, () => examsService.bulkRecordResults(chunk))
        if (written) resultCount += chunk.length
      }

      // Exam timetable for the end-of-term sittings only — an opener is done
      // in normal lesson slots, which is why not every exam has one.
      if (plan.name.includes('End of Term')) {
        for (const [i, code] of codes.entries()) {
          await examsService.addTimetableEntry({
            examId: exam.id,
            subjectId: subjectByCode.get(code)!,
            examDate: addDays(plan.date, Math.floor(i / 2)),
            startTime: i % 2 === 0 ? '08:30' : '11:00',
            endTime: i % 2 === 0 ? '10:30' : '13:00',
            venue: `${cls.name} Hall`,
          })
        }
      }
    }
  }
  console.log(`  2 grading scales, ${examCount} exams, ${resultCount} subject results`)

  // --- Attendance ------------------------------------------------------------
  console.log('Daily attendance register...')
  const attendanceDays = [...schoolDays(TERM_2.start, 18), ...schoolDays(TERM_3.start, 4)]
  let attendanceRows = 0
  for (const day of attendanceDays) {
    const records = allStudents.map((student) => ({
      studentId: student.id,
      attendanceDate: day,
      status: (chance(0.94) ? 'present' : chance(0.5) ? 'absent' : chance(0.5) ? 'late' : 'excused') as
        'present' | 'absent' | 'late' | 'excused',
      recordedBy: TEACHER_USER,
    }))
    const written = await tolerate(`attendance for ${day}`, () => attendanceService.markBulk(records))
    if (written) attendanceRows += records.length
  }
  console.log(`  ${attendanceDays.length} school days, ${attendanceRows} attendance records`)

  // --- Conduct: rules, points, incidents -------------------------------------
  console.log('Student conduct...')
  const conductRules = []
  for (const r of [
    { code: 'MERIT-ACAD', description: 'Outstanding academic performance', points: 10 },
    { code: 'MERIT-HELP', description: 'Helping a fellow student or member of staff', points: 5 },
    { code: 'MERIT-LEAD', description: 'Leadership in a club, house or class role', points: 8 },
    { code: 'MERIT-SPORT', description: 'Representing the school in a competition', points: 12 },
    { code: 'DEM-LATE', description: 'Late arrival to class or assembly', points: -3 },
    { code: 'DEM-NOISE', description: 'Noise-making during preps', points: -4 },
    { code: 'DEM-UNIF', description: 'Improper school uniform', points: -2 },
    { code: 'DEM-ABSENT', description: 'Absconding lessons or duties', points: -10 },
  ]) {
    conductRules.push(await conductPointsService.createRule(r))
  }

  let awards = 0
  for (const student of allStudents) {
    for (let i = 0, target = randInt(1, 5); i < target; i++) {
      const periodId = chance(0.5) ? P2 : P3
      const ruleId = pick(conductRules).id
      const awarded = await tolerate(`conduct points for ${student.name}`, () =>
        conductPointsService.award({ studentId: student.id, periodId, ruleId, awardedBy: TEACHER_USER }),
      )
      if (awarded) awards++
    }
  }

  const incidents = [
    {
      severity: 'minor' as const,
      description: 'Found outside the classroom during a lesson without permission.',
      actionTaken: 'Verbal warning issued and the class teacher informed.',
    },
    {
      severity: 'moderate' as const,
      description: 'Repeated noise-making during evening preps despite prior warnings.',
      actionTaken: 'Two days of supervised manual work; parent contacted by phone.',
    },
    {
      severity: 'minor' as const,
      description: 'Reported to the parade in an incomplete school uniform.',
      actionTaken: 'Uniform corrected the same day; recorded for monitoring.',
    },
    {
      severity: 'major' as const,
      description: 'Left the school compound without a gate pass during afternoon lessons.',
      actionTaken: 'Parent summoned; referred to the Deputy Principal for a formal hearing.',
    },
    {
      severity: 'moderate' as const,
      description: 'Damage to a laboratory stool during a practical session.',
      actionTaken: 'Restitution agreed with the parent; counselled on laboratory conduct.',
    },
  ]
  for (const [i, incident] of incidents.entries()) {
    await disciplineService.create({
      studentId: allStudents[i * 7].id,
      incidentDate: addDays(TERM_2.start, randInt(10, 60)),
      description: incident.description,
      actionTaken: incident.actionTaken,
      severity: incident.severity,
      recordedBy: TEACHER_USER,
    })
  }
  console.log(`  ${conductRules.length} conduct rules, ${awards} point awards, ${incidents.length} discipline incidents`)
}

export type AssessmentSeed = Awaited<ReturnType<typeof seedAssessment>>
