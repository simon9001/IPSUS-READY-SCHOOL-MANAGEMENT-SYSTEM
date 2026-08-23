import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { staff } from '../../db/schema/index.js'
import type { NewStaff } from './staff.types.js'

export const staffRepository = {
  findAll: () => db.select().from(staff),
  findById: (id: number) =>
    db.select().from(staff).where(eq(staff.id, id)).then((rows) => rows[0]),
  findByStaffNo: (staffNo: string) =>
    db.select().from(staff).where(eq(staff.staffNo, staffNo)).then((rows) => rows[0]),
  create: (data: NewStaff) => db.insert(staff).values(data).returning().then((rows) => rows[0]),
  update: (id: number, data: Partial<NewStaff>) =>
    db.update(staff).set(data).where(eq(staff.id, id)).returning().then((rows) => rows[0]),
}
