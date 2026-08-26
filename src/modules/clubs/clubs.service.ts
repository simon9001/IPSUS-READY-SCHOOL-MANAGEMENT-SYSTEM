import { clubsRepository } from './clubs.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { AddParticipantInput, CreateClubInput, CreateCompetitionInput, JoinClubInput } from './clubs.schema.js'

export const clubsService = {
  listClubs: () => clubsRepository.findAllClubs(),

  async getClubById(id: number) {
    const club = await clubsRepository.findClubById(id)
    if (!club) throw new NotFoundError(`Club ${id} not found`)
    return club
  },

  createClub: (input: CreateClubInput) => clubsRepository.createClub(input),

  listMembersByClub: (clubId: number) => clubsRepository.findMembersByClub(clubId),
  listMembershipsByStudent: (studentId: number) => clubsRepository.findMembershipsByStudent(studentId),

  async joinClub(input: JoinClubInput) {
    await this.getClubById(input.clubId)
    const existing = await clubsRepository.findMembership(input.clubId, input.studentId)
    if (existing) throw new ConflictError('This student is already an active member of this club')
    return clubsRepository.addMember(input)
  },

  listCompetitions: () => clubsRepository.findAllCompetitions(),

  async getCompetitionById(id: number) {
    const competition = await clubsRepository.findCompetitionById(id)
    if (!competition) throw new NotFoundError(`Competition ${id} not found`)
    return competition
  },

  createCompetition: (input: CreateCompetitionInput) => clubsRepository.createCompetition(input),

  listParticipantsByCompetition: (competitionId: number) => clubsRepository.findParticipantsByCompetition(competitionId),

  async addParticipant(input: AddParticipantInput) {
    await this.getCompetitionById(input.competitionId)
    return clubsRepository.addParticipant(input)
  },
}
