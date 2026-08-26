import type { libraryBooks, bookBorrowings } from '../../db/schema/index.js'

export type LibraryBook = typeof libraryBooks.$inferSelect
export type NewLibraryBook = typeof libraryBooks.$inferInsert
export type BookBorrowing = typeof bookBorrowings.$inferSelect
export type NewBookBorrowing = typeof bookBorrowings.$inferInsert
