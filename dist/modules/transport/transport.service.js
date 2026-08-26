import { transportRepository } from './transport.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const transportService = {
    listRoutes: () => transportRepository.findAllRoutes(),
    async getRouteById(id) {
        const route = await transportRepository.findRouteById(id);
        if (!route)
            throw new NotFoundError(`Bus route ${id} not found`);
        return route;
    },
    createRoute: (input) => transportRepository.createRoute({ ...input, feeAmount: input.feeAmount !== undefined ? String(input.feeAmount) : undefined }),
    listStopsByRoute: (routeId) => transportRepository.findStopsByRoute(routeId),
    addStop: (input) => transportRepository.addStop(input),
    listAllocationsByRoute: (routeId) => transportRepository.findAllocationsByRoute(routeId),
    async allocate(input) {
        const existing = await transportRepository.findActiveAllocationForStudent(input.studentId);
        if (existing)
            throw new ConflictError(`Student ${input.studentId} already has an active transport allocation — end it first`);
        const route = await this.getRouteById(input.routeId);
        if (route.capacity !== null) {
            const count = await transportRepository.activeAllocationCount(input.routeId);
            if (count >= route.capacity)
                throw new ConflictError(`Route ${route.routeName} is at full capacity (${route.capacity})`);
        }
        return transportRepository.createAllocation(input);
    },
    async endAllocation(id, endDate) {
        const allocation = await transportRepository.findAllocationById(id);
        if (!allocation)
            throw new NotFoundError(`Transport allocation ${id} not found`);
        if (allocation.status === 'inactive')
            throw new ConflictError(`Transport allocation ${id} is already ended`);
        return transportRepository.endAllocation(id, endDate);
    },
};
