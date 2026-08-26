import type { busRoutes, routeStops, studentTransportAllocations } from '../../db/schema/index.js'

export type BusRoute = typeof busRoutes.$inferSelect
export type NewBusRoute = typeof busRoutes.$inferInsert
export type RouteStop = typeof routeStops.$inferSelect
export type NewRouteStop = typeof routeStops.$inferInsert
export type StudentTransportAllocation = typeof studentTransportAllocations.$inferSelect
export type NewStudentTransportAllocation = typeof studentTransportAllocations.$inferInsert
