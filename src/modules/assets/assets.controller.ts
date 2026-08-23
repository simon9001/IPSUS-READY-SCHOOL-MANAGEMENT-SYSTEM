import type { Context } from 'hono'
import { assetsService } from './assets.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AcquireAssetInput, CreateAssetCategoryInput, DisposeAssetInput, RunDepreciationInput } from './assets.schema.js'

export const assetsController = {
  listCategories: async (c: Context) => ok(c, await assetsService.listCategories()),
  createCategory: async (c: Context) =>
    created(c, await assetsService.createCategory(getValidated<CreateAssetCategoryInput>(c, 'json'))),

  list: async (c: Context) => ok(c, await assetsService.list()),
  getById: async (c: Context) => ok(c, await assetsService.getById(Number(c.req.param('id')))),
  acquire: async (c: Context) =>
    created(c, await assetsService.acquire(getValidated<AcquireAssetInput>(c, 'json'))),

  runDepreciation: async (c: Context) =>
    created(c, await assetsService.runDepreciation(getValidated<RunDepreciationInput>(c, 'json'))),

  dispose: async (c: Context) =>
    created(c, await assetsService.dispose(Number(c.req.param('id')), getValidated<DisposeAssetInput>(c, 'json'))),
}
