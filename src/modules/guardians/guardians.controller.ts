import type { Context } from 'hono'
import { guardiansService } from './guardians.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { LinkGuardianInput } from './guardians.schema.js'

export const guardiansController = {
  listStudentsForGuardian: async (c: Context) =>
    ok(c, await guardiansService.listStudentsForGuardian(Number(c.req.param('userId')))),
  listGuardiansForStudent: async (c: Context) =>
    ok(c, await guardiansService.listGuardiansForStudent(Number(c.req.param('studentId')))),
  link: async (c: Context) => created(c, await guardiansService.link(getValidated<LinkGuardianInput>(c, 'json'))),
}
