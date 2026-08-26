import type { Context } from 'hono'
import { transportService } from './transport.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AddStopInput, AllocateTransportInput, CreateRouteInput, EndAllocationInput } from './transport.schema.js'

export const transportController = {
  listRoutes: async (c: Context) => ok(c, await transportService.listRoutes()),
  getRouteById: async (c: Context) => ok(c, await transportService.getRouteById(Number(c.req.param('id')))),
  createRoute: async (c: Context) =>
    created(c, await transportService.createRoute(getValidated<CreateRouteInput>(c, 'json'))),

  listStopsByRoute: async (c: Context) => ok(c, await transportService.listStopsByRoute(Number(c.req.param('routeId')))),
  addStop: async (c: Context) => created(c, await transportService.addStop(getValidated<AddStopInput>(c, 'json'))),

  listAllocationsByRoute: async (c: Context) =>
    ok(c, await transportService.listAllocationsByRoute(Number(c.req.param('routeId')))),
  allocate: async (c: Context) =>
    created(c, await transportService.allocate(getValidated<AllocateTransportInput>(c, 'json'))),
  endAllocation: async (c: Context) => {
    const { endDate } = getValidated<EndAllocationInput>(c, 'json')
    return ok(c, await transportService.endAllocation(Number(c.req.param('id')), endDate))
  },
}
