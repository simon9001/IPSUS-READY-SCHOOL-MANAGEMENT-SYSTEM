import { guardiansService } from './guardians.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const guardiansController = {
    listStudentsForGuardian: async (c) => ok(c, await guardiansService.listStudentsForGuardian(Number(c.req.param('userId')))),
    listGuardiansForStudent: async (c) => ok(c, await guardiansService.listGuardiansForStudent(Number(c.req.param('studentId')))),
    link: async (c) => created(c, await guardiansService.link(getValidated(c, 'json'))),
};
