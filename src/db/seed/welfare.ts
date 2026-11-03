import { boardingService } from '../../modules/boarding/boarding.service.js'
import { transportService } from '../../modules/transport/transport.service.js'
import { healthService } from '../../modules/health/health.service.js'
import { randInt, pick, chance, TERM_3, schoolDays, addDays } from './data.js'
import type { ReferenceDataSeed } from './reference.js'
import type { PeopleSeed } from './people.js'

export async function seedWelfare({ P3, NURSE, BOARDING_OFFICER, allStudents, staffByStaffNo }: ReferenceDataSeed & PeopleSeed) {
  // --- Boarding --------------------------------------------------------------
  console.log('Dormitories and boarding...')
  const boarders = allStudents.filter((s) => s.boarding === 'boarder')
  const dormitories = [
    await boardingService.createDormitory({
      name: 'Kirinyaga House',
      gender: 'boys',
      capacity: 40,
      wardenStaffId: staffByStaffNo.get('BOM/S06'),
    }),
    await boardingService.createDormitory({
      name: 'Elgon House',
      gender: 'boys',
      capacity: 40,
      wardenStaffId: staffByStaffNo.get('TSC/001'),
    }),
    await boardingService.createDormitory({
      name: 'Nyandarua House',
      gender: 'girls',
      capacity: 40,
      wardenStaffId: staffByStaffNo.get('BOM/S04'),
    }),
    await boardingService.createDormitory({
      name: 'Menengai House',
      gender: 'girls',
      capacity: 40,
      wardenStaffId: staffByStaffNo.get('TSC/004'),
    }),
  ]

  const boysDorms = [dormitories[0], dormitories[1]]
  const girlsDorms = [dormitories[2], dormitories[3]]
  const bedCounters = new Map<number, number>(dormitories.map((d) => [d.id, 1]))
  const allocatedBoarders: typeof boarders = []

  for (const student of boarders) {
    const options = student.gender === 'male' ? boysDorms : girlsDorms
    const dorm = options[allocatedBoarders.filter((s) => s.gender === student.gender).length % options.length]
    const bedNumber = bedCounters.get(dorm.id)!
    bedCounters.set(dorm.id, bedNumber + 1)

    await boardingService.allocateBed({
      studentId: student.id,
      dormitoryId: dorm.id,
      bedNumber: `B${String(bedNumber).padStart(3, '0')}`,
      periodId: P3,
      allocatedDate: TERM_3.start,
    })
    allocatedBoarders.push(student)
  }

  let boardingRows = 0
  for (const night of schoolDays(TERM_3.start, 3)) {
    const records = allocatedBoarders.map((student) => ({
      studentId: student.id,
      attendanceDate: night,
      status: (chance(0.96) ? 'present' : chance(0.5) ? 'absent' : 'on_leave') as 'present' | 'absent' | 'on_leave',
      recordedBy: BOARDING_OFFICER,
    }))
    await boardingService.markAttendanceBulk(records)
    boardingRows += records.length
  }
  console.log(`  ${dormitories.length} dormitories, ${allocatedBoarders.length} beds allocated, ${boardingRows} nightly roll-call records`)

  // --- Transport -------------------------------------------------------------
  console.log('Transport routes...')
  const routePlan = [
    {
      routeName: 'Route A — Kilimani / Kawangware',
      vehicleRegistration: 'KDA 331P',
      driverName: 'Simon Kariuki',
      capacity: 45,
      feeAmount: 6_000,
      stops: ['Kilimani Stage', 'Yaya Centre', 'Kawangware 46', 'Dagoretti Corner'],
    },
    {
      routeName: 'Route B — Langata / Karen',
      vehicleRegistration: 'KCX 774T',
      driverName: 'Boniface Otieno',
      capacity: 40,
      feeAmount: 7_500,
      stops: ['Langata Shopping Centre', 'Bomas', 'Karen Roundabout'],
    },
  ]
  const dayScholars = allStudents.filter((s) => s.boarding === 'day')
  let transportAllocations = 0

  for (const [index, plan] of routePlan.entries()) {
    const route = await transportService.createRoute({
      routeName: plan.routeName,
      vehicleRegistration: plan.vehicleRegistration,
      driverName: plan.driverName,
      driverPhone: `07${randInt(10, 99)}${randInt(100000, 999999)}`,
      capacity: plan.capacity,
      feeAmount: plan.feeAmount,
    })
    const stops = []
    for (const [order, stopName] of plan.stops.entries()) {
      stops.push(
        await transportService.addStop({
          routeId: route.id,
          stopName,
          stopOrder: order,
          pickupTime: `0${6 + Math.floor(order / 2)}:${order % 2 === 0 ? '00' : '30'}`,
        }),
      )
    }

    for (const student of dayScholars.filter((_, i) => i % routePlan.length === index)) {
      await transportService.allocate({
        studentId: student.id,
        routeId: route.id,
        stopId: pick(stops).id,
        periodId: P3,
        startDate: TERM_3.start,
      })
      transportAllocations++
    }
  }
  console.log(`  ${routePlan.length} routes, ${transportAllocations} student allocations`)

  // --- Health ----------------------------------------------------------------
  console.log('Health records...')
  const conditions = [
    { condition: 'Asthma', severity: 'moderate' as const, notes: 'Carries a salbutamol inhaler; avoid dusty duties.' },
    { condition: 'Peanut allergy', severity: 'severe' as const, notes: 'Kitchen and matron notified. Antihistamines held at the clinic.' },
    { condition: 'Sickle cell trait', severity: 'mild' as const, notes: 'Ensure adequate hydration during games.' },
    { condition: 'Epilepsy', severity: 'moderate' as const, notes: 'On regular medication; dormitory captain briefed.' },
  ]
  for (const [i, c] of conditions.entries()) {
    await healthService.createCondition({
      studentId: allStudents[i * 9].id,
      condition: c.condition,
      severity: c.severity,
      diagnosedDate: `${2020 + i}-0${randInt(1, 9)}-1${randInt(0, 9)}`,
      notes: c.notes,
      recordedBy: NURSE,
    })
  }

  const visits = [
    {
      complaint: 'Headache and mild fever since morning parade.',
      diagnosis: 'Suspected malaria',
      treatment: 'Paracetamol administered; blood slide requested.',
      referred: false,
    },
    {
      complaint: 'Sprained ankle during a games session.',
      diagnosis: 'Grade 1 ankle sprain',
      treatment: 'Cold compress, crepe bandage, excused from games for one week.',
      referred: false,
    },
    {
      complaint: 'Persistent abdominal pain over three days.',
      diagnosis: 'For further investigation',
      treatment: 'Initial analgesia given.',
      referred: true,
    },
    {
      complaint: 'Sore throat and difficulty swallowing.',
      diagnosis: 'Tonsillitis',
      treatment: 'Amoxicillin course started; warm saline gargle advised.',
      referred: false,
    },
    {
      complaint: 'Cut to the left hand from a laboratory glass breakage.',
      diagnosis: 'Superficial laceration',
      treatment: 'Cleaned and dressed; tetanus status confirmed current.',
      referred: false,
    },
    {
      complaint: 'Fainted during morning assembly.',
      diagnosis: 'Suspected anaemia',
      treatment: 'Rested at the clinic; parent contacted.',
      referred: true,
    },
  ]
  for (const [i, v] of visits.entries()) {
    const visit = await healthService.createVisit({
      studentId: allStudents[i * 6].id,
      visitDate: addDays(TERM_3.start, randInt(0, 3)),
      presentingComplaint: v.complaint,
      diagnosis: v.diagnosis,
      treatmentGiven: v.treatment,
      referredToHospital: v.referred,
      referralNotes: v.referred ? 'Referred to Kilimani Sub-County Hospital; guardian notified.' : undefined,
      attendedBy: NURSE,
    })
    await healthService.recordMedication({
      studentId: allStudents[i * 6].id,
      clinicVisitId: visit.id,
      medicationName: pick(['Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg', 'Oral Rehydration Salts']),
      dosage: pick(['1 tablet twice daily', '2 tablets three times daily', '1 sachet after meals']),
      administeredBy: NURSE,
    })
  }
  console.log(`  ${conditions.length} chronic conditions, ${visits.length} clinic visits (2 referred to hospital)`)
}

export type WelfareSeed = Awaited<ReturnType<typeof seedWelfare>>
