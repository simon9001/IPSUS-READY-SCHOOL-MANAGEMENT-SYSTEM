import { and, between, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { leaveRequests, leaveTypes } from '../../db/schema/index.js';
export const leaveRepository = {
    findAllTypes: () => db.select().from(leaveTypes),
    findTypeById: (id) => db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).then((rows) => rows[0]),
    createType: (data) => db.insert(leaveTypes).values(data).returning().then((rows) => rows[0]),
    findAll: () => db.select().from(leaveRequests),
    findById: (id) => db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).then((rows) => rows[0]),
    findByStaff: (staffId) => db.select().from(leaveRequests).where(eq(leaveRequests.staffId, staffId)),
    create: (data) => db.insert(leaveRequests).values(data).returning().then((rows) => rows[0]),
    decide: (id, status, approverId) => db
        .update(leaveRequests)
        .set({ status, approvedBy: approverId, approvedAt: new Date() })
        .where(eq(leaveRequests.id, id))
        .returning()
        .then((rows) => rows[0]),
    async approvedDaysTakenInYear(staffId, leaveTypeId, year) {
        const [row] = await db
            .select({ total: sql `coalesce(sum(${leaveRequests.daysRequested}), 0)` })
            .from(leaveRequests)
            .where(and(eq(leaveRequests.staffId, staffId), eq(leaveRequests.leaveTypeId, leaveTypeId), eq(leaveRequests.status, 'approved'), between(leaveRequests.startDate, `${year}-01-01`, `${year}-12-31`)));
        return Number(row?.total ?? 0);
    },
};
