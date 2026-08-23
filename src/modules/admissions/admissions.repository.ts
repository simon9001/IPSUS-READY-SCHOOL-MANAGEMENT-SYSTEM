import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { admissions } from '../../db/schema/index.js'
import type { NewAdmission } from './admissions.types.js'

export const admissionsRepository = {
  findAll: () => db.select().from(admissions),
  findById: (id: number) =>
    db.select().from(admissions).where(eq(admissions.id, id)).then((rows) => rows[0]),
  findByUpi: (nemisUpi: string) =>
    db.select().from(admissions).where(eq(admissions.nemisUpi, nemisUpi)).then((rows) => rows[0]),

  create: (data: NewAdmission) => db.insert(admissions).values(data).returning().then((rows) => rows[0]),
  update: (id: number, data: Partial<NewAdmission>) =>
    db.update(admissions).set(data).where(eq(admissions.id, id)).returning().then((rows) => rows[0]),
}
