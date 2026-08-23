import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { disciplinaryCases } from '../../db/schema/index.js'
import type { NewDisciplinaryCase } from './disciplinaryCases.types.js'

export const disciplinaryCasesRepository = {
  findAll: () => db.select().from(disciplinaryCases),
  findByStudent: (studentId: number) => db.select().from(disciplinaryCases).where(eq(disciplinaryCases.studentId, studentId)),
  findById: (id: number) =>
    db.select().from(disciplinaryCases).where(eq(disciplinaryCases.id, id)).then((rows) => rows[0]),

  create: (data: NewDisciplinaryCase) => db.insert(disciplinaryCases).values(data).returning().then((rows) => rows[0]),
  update: (id: number, data: Partial<NewDisciplinaryCase>) =>
    db.update(disciplinaryCases).set(data).where(eq(disciplinaryCases.id, id)).returning().then((rows) => rows[0]),
}
