import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { clubMemberships, clubs, competitionParticipants, competitions } from '../../db/schema/index.js'
import type { NewClub, NewClubMembership, NewCompetition, NewCompetitionParticipant } from './clubs.types.js'

export const clubsRepository = {
  findAllClubs: () => db.select().from(clubs),
  findClubById: (id: number) =>
    db.select().from(clubs).where(eq(clubs.id, id)).then((rows) => rows[0]),
  createClub: (data: NewClub) => db.insert(clubs).values(data).returning().then((rows) => rows[0]),

  findMembersByClub: (clubId: number) => db.select().from(clubMemberships).where(eq(clubMemberships.clubId, clubId)),
  findMembershipsByStudent: (studentId: number) => db.select().from(clubMemberships).where(eq(clubMemberships.studentId, studentId)),
  findMembership: (clubId: number, studentId: number) =>
    db
      .select()
      .from(clubMemberships)
      .where(and(eq(clubMemberships.clubId, clubId), eq(clubMemberships.studentId, studentId), eq(clubMemberships.status, 'active')))
      .then((rows) => rows[0]),
  addMember: (data: NewClubMembership) => db.insert(clubMemberships).values(data).returning().then((rows) => rows[0]),

  findAllCompetitions: () => db.select().from(competitions),
  findCompetitionById: (id: number) =>
    db.select().from(competitions).where(eq(competitions.id, id)).then((rows) => rows[0]),
  createCompetition: (data: NewCompetition) => db.insert(competitions).values(data).returning().then((rows) => rows[0]),

  findParticipantsByCompetition: (competitionId: number) =>
    db.select().from(competitionParticipants).where(eq(competitionParticipants.competitionId, competitionId)),
  addParticipant: (data: NewCompetitionParticipant) =>
    db.insert(competitionParticipants).values(data).returning().then((rows) => rows[0]),
}
