import type { Context } from 'hono'
import { systemService } from './system.service.js'
import { ok } from '../../common/response.js'

export const systemController = {
  health: async (c: Context) => ok(c, await systemService.health()),
  rbacStatus: async (c: Context) => ok(c, await systemService.rbacStatus()),
}
