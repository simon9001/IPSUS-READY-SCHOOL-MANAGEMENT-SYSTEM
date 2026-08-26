import type { Context } from 'hono'
import { libraryService } from './library.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { BorrowBookInput, CreateBookInput, PayFineInput, ReturnBookInput } from './library.schema.js'

export const libraryController = {
  listBooks: async (c: Context) => ok(c, await libraryService.listBooks()),
  getBookById: async (c: Context) => ok(c, await libraryService.getBookById(Number(c.req.param('id')))),
  createBook: async (c: Context) => created(c, await libraryService.createBook(getValidated<CreateBookInput>(c, 'json'))),

  listBorrowingsByStudent: async (c: Context) =>
    ok(c, await libraryService.listBorrowingsByStudent(Number(c.req.param('studentId')))),
  listOverdue: async (c: Context) =>
    ok(c, await libraryService.listOverdue(c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10))),

  borrow: async (c: Context) => created(c, await libraryService.borrow(getValidated<BorrowBookInput>(c, 'json'))),
  returnBook: async (c: Context) =>
    ok(c, await libraryService.returnBook(Number(c.req.param('id')), getValidated<ReturnBookInput>(c, 'json'))),
  payFine: async (c: Context) =>
    ok(c, await libraryService.payFine(Number(c.req.param('id')), getValidated<PayFineInput>(c, 'json'))),
}
