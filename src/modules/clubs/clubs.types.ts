import type { clubs, clubMemberships, competitions, competitionParticipants } from '../../db/schema/index.js'

export type Club = typeof clubs.$inferSelect
export type NewClub = typeof clubs.$inferInsert
export type ClubMembership = typeof clubMemberships.$inferSelect
export type NewClubMembership = typeof clubMemberships.$inferInsert
export type Competition = typeof competitions.$inferSelect
export type NewCompetition = typeof competitions.$inferInsert
export type CompetitionParticipant = typeof competitionParticipants.$inferSelect
export type NewCompetitionParticipant = typeof competitionParticipants.$inferInsert
