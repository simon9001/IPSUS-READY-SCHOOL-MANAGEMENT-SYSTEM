import { transportService } from './transport.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const transportController = {
    listRoutes: async (c) => ok(c, await transportService.listRoutes()),
    getRouteById: async (c) => ok(c, await transportService.getRouteById(Number(c.req.param('id')))),
    createRoute: async (c) => created(c, await transportService.createRoute(getValidated(c, 'json'))),
    listStopsByRoute: async (c) => ok(c, await transportService.listStopsByRoute(Number(c.req.param('routeId')))),
    addStop: async (c) => created(c, await transportService.addStop(getValidated(c, 'json'))),
    listAllocationsByRoute: async (c) => ok(c, await transportService.listAllocationsByRoute(Number(c.req.param('routeId')))),
    allocate: async (c) => created(c, await transportService.allocate(getValidated(c, 'json'))),
    endAllocation: async (c) => {
        const { endDate } = getValidated(c, 'json');
        return ok(c, await transportService.endAllocation(Number(c.req.param('id')), endDate));
    },
};
