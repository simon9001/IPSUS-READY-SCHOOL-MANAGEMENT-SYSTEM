import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { staffDisciplinaryRecords } from '../../db/schema/index.js'
import type { NewStaffDisciplinaryRecord } from './staffDiscipline.types.js'

export const staffDisciplineRepository = {
  findByStaff: (staffId: number) => db.select().from(staffDisciplinaryRecords).where(eq(staffDisciplinaryRecords.staffId, staffId)),
  findById: (id: number) =>
    db.select().from(staffDisciplinaryRecords).where(eq(staffDisciplinaryRecords.id, id)).then((rows) => rows[0]),
  create: (data: NewStaffDisciplinaryRecord) =>
    db.insert(staffDisciplinaryRecords).values(data).returning().then((rows) => rows[0]),
}
