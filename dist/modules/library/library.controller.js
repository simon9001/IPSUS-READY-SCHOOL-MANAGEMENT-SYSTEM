import { libraryService } from './library.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const libraryController = {
    listBooks: async (c) => ok(c, await libraryService.listBooks()),
    getBookById: async (c) => ok(c, await libraryService.getBookById(Number(c.req.param('id')))),
    createBook: async (c) => created(c, await libraryService.createBook(getValidated(c, 'json'))),
    listBorrowingsByStudent: async (c) => ok(c, await libraryService.listBorrowingsByStudent(Number(c.req.param('studentId')))),
    listOverdue: async (c) => ok(c, await libraryService.listOverdue(c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10))),
    borrow: async (c) => created(c, await libraryService.borrow(getValidated(c, 'json'))),
    returnBook: async (c) => ok(c, await libraryService.returnBook(Number(c.req.param('id')), getValidated(c, 'json'))),
    payFine: async (c) => ok(c, await libraryService.payFine(Number(c.req.param('id')), getValidated(c, 'json'))),
};
