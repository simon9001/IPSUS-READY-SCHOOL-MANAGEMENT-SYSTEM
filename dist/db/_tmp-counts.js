import { sql } from 'drizzle-orm';
import { db } from './client.js';
import * as s from './schema/index.js';
const names = ['students', 'classes', 'teachers', 'staff', 'subjects', 'timetableEntries', 'feeStructures', 'feeInvoices', 'feePayments', 'journalEntries', 'journalLines', 'examResults', 'attendanceRecords', 'conductPoints', 'bookBorrowings'];
for (const name of names) {
    const table = s[name];
    if (!table) {
        console.log(name.padEnd(20), 'NO SUCH EXPORT');
        continue;
    }
    const [row] = await db.select({ n: sql `count(*)::int` }).from(table);
    console.log(name.padEnd(20), row.n);
}
process.exit(0);
