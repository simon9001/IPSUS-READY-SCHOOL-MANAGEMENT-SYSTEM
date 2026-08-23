import { assetsService } from './assets.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const assetsController = {
    listCategories: async (c) => ok(c, await assetsService.listCategories()),
    createCategory: async (c) => created(c, await assetsService.createCategory(getValidated(c, 'json'))),
    list: async (c) => ok(c, await assetsService.list()),
    getById: async (c) => ok(c, await assetsService.getById(Number(c.req.param('id')))),
    acquire: async (c) => created(c, await assetsService.acquire(getValidated(c, 'json'))),
    runDepreciation: async (c) => created(c, await assetsService.runDepreciation(getValidated(c, 'json'))),
    dispose: async (c) => created(c, await assetsService.dispose(Number(c.req.param('id')), getValidated(c, 'json'))),
};
