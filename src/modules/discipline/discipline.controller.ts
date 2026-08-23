import type { Context } from 'hono'
import { disciplineService } from './discipline.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateDisciplineRecordInput } from './discipline.schema.js'

export const disciplineController = {
  listByStudent: async (c: Context) => ok(c, await disciplineService.listByStudent(Number(c.req.param('studentId')))),
  getById: async (c: Context) => ok(c, await disciplineService.getById(Number(c.req.param('id')))),
  create: async (c: Context) =>
    created(c, await disciplineService.create(getValidated<CreateDisciplineRecordInput>(c, 'json'))),
}
