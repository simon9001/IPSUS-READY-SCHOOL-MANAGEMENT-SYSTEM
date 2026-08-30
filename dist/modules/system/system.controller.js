import { systemService } from './system.service.js';
import { ok } from '../../common/response.js';
export const systemController = {
    health: async (c) => ok(c, await systemService.health()),
    rbacStatus: async (c) => ok(c, await systemService.rbacStatus()),
};
