import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { staffContracts } from '../../db/schema/index.js'
import type { NewStaffContract } from './contracts.types.js'

export const contractsRepository = {
  findByStaff: (staffId: number) => db.select().from(staffContracts).where(eq(staffContracts.staffId, staffId)),
  findById: (id: number) =>
    db.select().from(staffContracts).where(eq(staffContracts.id, id)).then((rows) => rows[0]),
  create: (data: NewStaffContract) => db.insert(staffContracts).values(data).returning().then((rows) => rows[0]),
  updateStatus: (id: number, status: 'active' | 'expired' | 'terminated') =>
    db.update(staffContracts).set({ status }).where(eq(staffContracts.id, id)).returning().then((rows) => rows[0]),
}
