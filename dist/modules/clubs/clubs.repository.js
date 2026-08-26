import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { clubMemberships, clubs, competitionParticipants, competitions } from '../../db/schema/index.js';
export const clubsRepository = {
    findAllClubs: () => db.select().from(clubs),
    findClubById: (id) => db.select().from(clubs).where(eq(clubs.id, id)).then((rows) => rows[0]),
    createClub: (data) => db.insert(clubs).values(data).returning().then((rows) => rows[0]),
    findMembersByClub: (clubId) => db.select().from(clubMemberships).where(eq(clubMemberships.clubId, clubId)),
    findMembershipsByStudent: (studentId) => db.select().from(clubMemberships).where(eq(clubMemberships.studentId, studentId)),
    findMembership: (clubId, studentId) => db
        .select()
        .from(clubMemberships)
        .where(and(eq(clubMemberships.clubId, clubId), eq(clubMemberships.studentId, studentId), eq(clubMemberships.status, 'active')))
        .then((rows) => rows[0]),
    addMember: (data) => db.insert(clubMemberships).values(data).returning().then((rows) => rows[0]),
    findAllCompetitions: () => db.select().from(competitions),
    findCompetitionById: (id) => db.select().from(competitions).where(eq(competitions.id, id)).then((rows) => rows[0]),
    createCompetition: (data) => db.insert(competitions).values(data).returning().then((rows) => rows[0]),
    findParticipantsByCompetition: (competitionId) => db.select().from(competitionParticipants).where(eq(competitionParticipants.competitionId, competitionId)),
    addParticipant: (data) => db.insert(competitionParticipants).values(data).returning().then((rows) => rows[0]),
};
