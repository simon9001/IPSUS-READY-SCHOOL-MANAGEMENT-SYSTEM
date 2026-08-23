import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { disciplineRecords } from '../../db/schema/index.js'
import type { NewDisciplineRecord } from './discipline.types.js'

export const disciplineRepository = {
  findByStudent: (studentId: number) => db.select().from(disciplineRecords).where(eq(disciplineRecords.studentId, studentId)),
  findById: (id: number) =>
    db.select().from(disciplineRecords).where(eq(disciplineRecords.id, id)).then((rows) => rows[0]),
  create: (data: NewDisciplineRecord) => db.insert(disciplineRecords).values(data).returning().then((rows) => rows[0]),
}
