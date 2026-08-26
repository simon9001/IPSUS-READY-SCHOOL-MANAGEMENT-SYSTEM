import { clubsRepository } from './clubs.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const clubsService = {
    listClubs: () => clubsRepository.findAllClubs(),
    async getClubById(id) {
        const club = await clubsRepository.findClubById(id);
        if (!club)
            throw new NotFoundError(`Club ${id} not found`);
        return club;
    },
    createClub: (input) => clubsRepository.createClub(input),
    listMembersByClub: (clubId) => clubsRepository.findMembersByClub(clubId),
    listMembershipsByStudent: (studentId) => clubsRepository.findMembershipsByStudent(studentId),
    async joinClub(input) {
        await this.getClubById(input.clubId);
        const existing = await clubsRepository.findMembership(input.clubId, input.studentId);
        if (existing)
            throw new ConflictError('This student is already an active member of this club');
        return clubsRepository.addMember(input);
    },
    listCompetitions: () => clubsRepository.findAllCompetitions(),
    async getCompetitionById(id) {
        const competition = await clubsRepository.findCompetitionById(id);
        if (!competition)
            throw new NotFoundError(`Competition ${id} not found`);
        return competition;
    },
    createCompetition: (input) => clubsRepository.createCompetition(input),
    listParticipantsByCompetition: (competitionId) => clubsRepository.findParticipantsByCompetition(competitionId),
    async addParticipant(input) {
        await this.getCompetitionById(input.competitionId);
        return clubsRepository.addParticipant(input);
    },
};
