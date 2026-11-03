import { libraryService } from '../../modules/library/library.service.js'
import { clubsService } from '../../modules/clubs/clubs.service.js'
import { noticesService } from '../../modules/notices/notices.service.js'
import { randInt, pick, chance, TERM_1, TERM_3, addDays } from './data.js'
import type { ReferenceDataSeed } from './reference.js'
import type { PeopleSeed } from './people.js'

export async function seedActivities({ PRINCIPAL, LIBRARIAN, allStudents, staffByStaffNo }: ReferenceDataSeed & PeopleSeed) {
  // --- Library ---------------------------------------------------------------
  console.log('Library...')
  const books = []
  for (const b of [
    { isbn: '9789966493217', title: 'Secondary Mathematics Book 4', author: 'KLB', category: 'Mathematics', totalCopies: 60 },
    { isbn: '9789966251534', title: 'Head of State', author: 'Andrew Ekwuru', category: 'Set Text', totalCopies: 45 },
    { isbn: '9789966560421', title: 'Fathers of Nations', author: 'Paul B. Vitta', category: 'Set Text', totalCopies: 50 },
    { isbn: '9789966101112', title: 'A Doll’s House', author: 'Henrik Ibsen', category: 'Set Text', totalCopies: 48 },
    { isbn: '9789966257788', title: 'Secondary Chemistry Book 3', author: 'KLB', category: 'Sciences', totalCopies: 40 },
    { isbn: '9789966339900', title: 'Golden Tips Biology', author: 'Longhorn', category: 'Sciences', totalCopies: 35 },
    { isbn: '9789966447711', title: 'Kamusi ya Kiswahili Sanifu', author: 'TUKI', category: 'Kiswahili', totalCopies: 30 },
    { isbn: '9789966998822', title: 'Certificate Geography Form 3', author: 'KLB', category: 'Humanities', totalCopies: 32 },
  ]) {
    books.push(await libraryService.createBook(b))
  }

  let borrowings = 0
  let overdue = 0
  for (let i = 0; i < 26; i++) {
    const student = allStudents[(i * 3) % allStudents.length]
    const book = books[i % books.length]
    // A third of the loans are already past their due date, so the overdue
    // widget and the automatic fine calculation both have real input.
    const isOverdue = i % 3 === 0
    const borrowedDate = isOverdue ? addDays(TERM_3.start, -20) : addDays(TERM_3.start, 1)
    const dueDate = isOverdue ? addDays(TERM_3.start, -6) : addDays(TERM_3.start, 15)

    const borrowing = await libraryService.borrow({
      bookId: book.id,
      studentId: student.id,
      borrowedDate,
      dueDate,
      issuedBy: LIBRARIAN,
    })
    borrowings++
    if (isOverdue) overdue++

    // Some loans come back; the rest stay out on loan.
    if (i % 4 === 1) {
      await libraryService.returnBook(borrowing.id, { returnedDate: addDays(TERM_3.start, 2), returnedTo: LIBRARIAN, lost: false })
    }
  }
  console.log(`  ${books.length} titles, ${borrowings} borrowings (${overdue} overdue)`)

  // --- Clubs and competitions ------------------------------------------------
  console.log('Clubs and competitions...')
  const clubPlan = [
    { name: 'Drama Club', category: 'club' as const, patron: 'TSC/002' },
    { name: 'Science Congress', category: 'society' as const, patron: 'TSC/005' },
    { name: 'Football (Boys)', category: 'sport' as const, patron: 'TSC/001' },
    { name: 'Volleyball (Girls)', category: 'sport' as const, patron: 'TSC/004' },
    { name: 'Christian Union', category: 'society' as const, patron: 'TSC/006' },
    { name: 'Debate & Journalism Club', category: 'club' as const, patron: 'BOM/T03' },
  ]
  const clubs = []
  for (const c of clubPlan) {
    clubs.push(
      await clubsService.createClub({
        name: c.name,
        category: c.category,
        patronStaffId: staffByStaffNo.get(c.patron),
        description: `${c.name} meets every Wednesday afternoon during the co-curricular slot.`,
      }),
    )
  }

  let memberships = 0
  for (const student of allStudents) {
    for (const club of [clubs[randInt(0, clubs.length - 1)], clubs[randInt(0, clubs.length - 1)]]) {
      try {
        await clubsService.joinClub({
          clubId: club.id,
          studentId: student.id,
          joinedDate: TERM_1.start,
          role: chance(0.1) ? pick(['Chairperson', 'Secretary', 'Treasurer']) : 'Member',
        })
        memberships++
      } catch {
        // The same student drawn twice for one club — the service rejects the
        // duplicate membership, which is the behaviour we want to keep.
      }
    }
  }

  const competitionPlan = [
    { name: 'Sub-County Drama Festival', clubIndex: 0, level: 'zonal' as const, date: '2026-05-20', venue: 'Dagoretti High School' },
    { name: 'County Science Congress', clubIndex: 1, level: 'county' as const, date: '2026-06-17', venue: 'Nairobi School' },
    { name: 'Regional Term 2 Ball Games', clubIndex: 2, level: 'regional' as const, date: '2026-07-08', venue: 'Nyayo National Stadium' },
    { name: 'National Drama Festival', clubIndex: 0, level: 'national' as const, date: '2026-04-14', venue: 'Nakuru' },
  ]
  let participants = 0
  for (const c of competitionPlan) {
    const competition = await clubsService.createCompetition({
      name: c.name,
      clubId: clubs[c.clubIndex].id,
      level: c.level,
      competitionDate: c.date,
      venue: c.venue,
    })
    for (let i = 0; i < 6; i++) {
      await clubsService.addParticipant({
        competitionId: competition.id,
        studentId: allStudents[(participants * 5 + 3) % allStudents.length].id,
        result: pick(['1st', '2nd', '3rd', 'Participant', 'Finalist']),
        achievement: chance(0.35) ? 'Qualified for the next level' : undefined,
      })
      participants++
    }
  }
  console.log(`  ${clubs.length} clubs, ${memberships} memberships, ${competitionPlan.length} competitions, ${participants} participants`)

  // --- Notices ---------------------------------------------------------------
  console.log('Notices...')
  const noticePlan = [
    {
      title: 'Term 3 Opening — 31 August 2026',
      body: 'All learners report on Monday 31 August 2026 by 4.00pm. Boarders should carry the full list of personal effects circulated last term. Fee balances for Term 2 must be cleared before reporting.',
      audience: 'all' as const,
    },
    {
      title: 'Form 4 KCSE Registration',
      body: 'Form 4 candidates must confirm their KCSE registration details at the Deputy Principal’s office before Friday 11 September 2026. Corrections cannot be made after the KNEC deadline.',
      audience: 'all' as const,
    },
    {
      title: 'Parents’ Academic Day — 26 September 2026',
      body: 'Parents and guardians are invited to the Term 3 Academic Day on Saturday 26 September 2026 from 9.00am. Class teachers will issue Term 2 report forms and discuss individual progress.',
      audience: 'parents' as const,
    },
    {
      title: 'Staff Briefing — Monday 7 September',
      body: 'All teaching staff to attend a briefing in the staffroom at 4.15pm on the Term 3 examination calendar and syllabus coverage returns.',
      audience: 'staff' as const,
    },
    {
      title: 'Water Rationing Advisory',
      body: 'Following the county water supply interruption, dormitories will have running water between 5.00am–8.00am and 5.00pm–9.00pm until further notice.',
      audience: 'all' as const,
    },
  ]
  for (const n of noticePlan) {
    await noticesService.create({ ...n, publishedBy: PRINCIPAL, publishNow: true })
  }
  console.log(`  ${noticePlan.length} notices published`)
}

export type ActivitiesSeed = Awaited<ReturnType<typeof seedActivities>>
