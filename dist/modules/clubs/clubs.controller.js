import { clubsService } from './clubs.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const clubsController = {
    listClubs: async (c) => ok(c, await clubsService.listClubs()),
    getClubById: async (c) => ok(c, await clubsService.getClubById(Number(c.req.param('id')))),
    createClub: async (c) => created(c, await clubsService.createClub(getValidated(c, 'json'))),
    listMembersByClub: async (c) => ok(c, await clubsService.listMembersByClub(Number(c.req.param('clubId')))),
    listMembershipsByStudent: async (c) => ok(c, await clubsService.listMembershipsByStudent(Number(c.req.param('studentId')))),
    joinClub: async (c) => created(c, await clubsService.joinClub(getValidated(c, 'json'))),
    listCompetitions: async (c) => ok(c, await clubsService.listCompetitions()),
    getCompetitionById: async (c) => ok(c, await clubsService.getCompetitionById(Number(c.req.param('id')))),
    createCompetition: async (c) => created(c, await clubsService.createCompetition(getValidated(c, 'json'))),
    listParticipantsByCompetition: async (c) => ok(c, await clubsService.listParticipantsByCompetition(Number(c.req.param('competitionId')))),
    addParticipant: async (c) => created(c, await clubsService.addParticipant(getValidated(c, 'json'))),
};
