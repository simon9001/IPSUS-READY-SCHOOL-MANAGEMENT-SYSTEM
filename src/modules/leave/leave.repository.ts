import { and, between, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { leaveRequests, leaveTypes } from '../../db/schema/index.js'
import type { NewLeaveRequest, NewLeaveType } from './leave.types.js'

export const leaveRepository = {
  findAllTypes: () => db.select().from(leaveTypes),
  findTypeById: (id: number) =>
    db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).then((rows) => rows[0]),
  createType: (data: NewLeaveType) => db.insert(leaveTypes).values(data).returning().then((rows) => rows[0]),

  findAll: () => db.select().from(leaveRequests),
  findById: (id: number) =>
    db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).then((rows) => rows[0]),
  findByStaff: (staffId: number) => db.select().from(leaveRequests).where(eq(leaveRequests.staffId, staffId)),

  create: (data: NewLeaveRequest) => db.insert(leaveRequests).values(data).returning().then((rows) => rows[0]),

  decide: (id: number, status: 'approved' | 'rejected', approverId: number) =>
    db
      .update(leaveRequests)
      .set({ status, approvedBy: approverId, approvedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning()
      .then((rows) => rows[0]),

  async approvedDaysTakenInYear(staffId: number, leaveTypeId: number, year: number) {
    const [row] = await db
      .select({ total: sql<string>`coalesce(sum(${leaveRequests.daysRequested}), 0)` })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.staffId, staffId),
          eq(leaveRequests.leaveTypeId, leaveTypeId),
          eq(leaveRequests.status, 'approved'),
          between(leaveRequests.startDate, `${year}-01-01`, `${year}-12-31`),
        ),
      )
    return Number(row?.total ?? 0)
  },
}
