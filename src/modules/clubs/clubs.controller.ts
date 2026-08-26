import type { Context } from 'hono'
import { clubsService } from './clubs.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AddParticipantInput, CreateClubInput, CreateCompetitionInput, JoinClubInput } from './clubs.schema.js'

export const clubsController = {
  listClubs: async (c: Context) => ok(c, await clubsService.listClubs()),
  getClubById: async (c: Context) => ok(c, await clubsService.getClubById(Number(c.req.param('id')))),
  createClub: async (c: Context) => created(c, await clubsService.createClub(getValidated<CreateClubInput>(c, 'json'))),

  listMembersByClub: async (c: Context) => ok(c, await clubsService.listMembersByClub(Number(c.req.param('clubId')))),
  listMembershipsByStudent: async (c: Context) =>
    ok(c, await clubsService.listMembershipsByStudent(Number(c.req.param('studentId')))),
  joinClub: async (c: Context) => created(c, await clubsService.joinClub(getValidated<JoinClubInput>(c, 'json'))),

  listCompetitions: async (c: Context) => ok(c, await clubsService.listCompetitions()),
  getCompetitionById: async (c: Context) => ok(c, await clubsService.getCompetitionById(Number(c.req.param('id')))),
  createCompetition: async (c: Context) =>
    created(c, await clubsService.createCompetition(getValidated<CreateCompetitionInput>(c, 'json'))),

  listParticipantsByCompetition: async (c: Context) =>
    ok(c, await clubsService.listParticipantsByCompetition(Number(c.req.param('competitionId')))),
  addParticipant: async (c: Context) =>
    created(c, await clubsService.addParticipant(getValidated<AddParticipantInput>(c, 'json'))),
}
