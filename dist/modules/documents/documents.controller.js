import { documentsService } from './documents.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const documentsController = {
    listTemplates: async (c) => ok(c, await documentsService.listTemplates()),
    createTemplate: async (c) => created(c, await documentsService.createTemplate(getValidated(c, 'json'))),
    listAll: async (c) => ok(c, await documentsService.listAll()),
    listByStudent: async (c) => ok(c, await documentsService.listByStudent(Number(c.req.param('studentId')))),
    getById: async (c) => ok(c, await documentsService.getById(Number(c.req.param('id')))),
    renderLetter: async (c) => created(c, await documentsService.renderLetter(getValidated(c, 'json'))),
    generateTranscript: async (c) => created(c, await documentsService.generateTranscript(getValidated(c, 'json'))),
    generateFeeClearanceLetter: async (c) => created(c, await documentsService.generateFeeClearanceLetter(getValidated(c, 'json'))),
    revoke: async (c) => ok(c, await documentsService.revoke(Number(c.req.param('id')))),
};
