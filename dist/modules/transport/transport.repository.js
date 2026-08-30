import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { busRoutes, routeStops, studentTransportAllocations } from '../../db/schema/index.js';
export const transportRepository = {
    findAllRoutes: () => db.select().from(busRoutes),
    findRouteById: (id) => db.select().from(busRoutes).where(eq(busRoutes.id, id)).then((rows) => rows[0]),
    createRoute: (data) => db.insert(busRoutes).values(data).returning().then((rows) => rows[0]),
    findStopsByRoute: (routeId) => db.select().from(routeStops).where(eq(routeStops.routeId, routeId)),
    addStop: (data) => db.insert(routeStops).values(data).returning().then((rows) => rows[0]),
    async activeAllocationCount(routeId) {
        const [row] = await db
            .select({ count: sql `count(*)::int` })
            .from(studentTransportAllocations)
            .where(and(eq(studentTransportAllocations.routeId, routeId), eq(studentTransportAllocations.status, 'active')));
        return row?.count ?? 0;
    },
    async countActiveAllocations() {
        const [row] = await db
            .select({ count: sql `count(*)::int` })
            .from(studentTransportAllocations)
            .where(eq(studentTransportAllocations.status, 'active'));
        return row?.count ?? 0;
    },
    findActiveAllocationForStudent: (studentId) => db
        .select()
        .from(studentTransportAllocations)
        .where(and(eq(studentTransportAllocations.studentId, studentId), eq(studentTransportAllocations.status, 'active')))
        .then((rows) => rows[0]),
    findAllocationsByRoute: (routeId) => db.select().from(studentTransportAllocations).where(eq(studentTransportAllocations.routeId, routeId)),
    findAllocationById: (id) => db.select().from(studentTransportAllocations).where(eq(studentTransportAllocations.id, id)).then((rows) => rows[0]),
    createAllocation: (data) => db.insert(studentTransportAllocations).values(data).returning().then((rows) => rows[0]),
    endAllocation: (id, endDate) => db
        .update(studentTransportAllocations)
        .set({ status: 'inactive', endDate })
        .where(eq(studentTransportAllocations.id, id))
        .returning()
        .then((rows) => rows[0]),
};
