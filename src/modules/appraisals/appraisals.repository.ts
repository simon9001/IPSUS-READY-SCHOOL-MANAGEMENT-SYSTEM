import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { staffAppraisals } from '../../db/schema/index.js'
import type { NewStaffAppraisal } from './appraisals.types.js'

export const appraisalsRepository = {
  findByStaff: (staffId: number) => db.select().from(staffAppraisals).where(eq(staffAppraisals.staffId, staffId)),
  findById: (id: number) =>
    db.select().from(staffAppraisals).where(eq(staffAppraisals.id, id)).then((rows) => rows[0]),
  create: (data: NewStaffAppraisal) =>
    db.insert(staffAppraisals).values(data).returning().then((rows) => rows[0]),
  update: (id: number, data: Partial<NewStaffAppraisal>) =>
    db.update(staffAppraisals).set(data).where(eq(staffAppraisals.id, id)).returning().then((rows) => rows[0]),
}
