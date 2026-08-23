import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { teachers } from '../../db/schema/index.js'
import type { NewTeacher } from './teachers.types.js'

export const teachersRepository = {
  findAll: () => db.select().from(teachers),
  findById: (id: number) =>
    db.select().from(teachers).where(eq(teachers.id, id)).then((rows) => rows[0]),
  findByStaffNo: (staffNo: string) =>
    db.select().from(teachers).where(eq(teachers.staffNo, staffNo)).then((rows) => rows[0]),
  create: (data: NewTeacher) => db.insert(teachers).values(data).returning().then((rows) => rows[0]),
  update: (id: number, data: Partial<NewTeacher>) =>
    db.update(teachers).set(data).where(eq(teachers.id, id)).returning().then((rows) => rows[0]),
}
