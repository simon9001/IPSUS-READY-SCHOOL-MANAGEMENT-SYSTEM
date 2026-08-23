import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { accounts, funds, fiscalPeriods, journalEntries, journalLines } from '../../db/schema/index.js';
import { createManualJournalEntry, postSystemJournalEntry, approveJournalEntry, rejectJournalEntry, getTrialBalance, UnbalancedEntryError, PeriodClosedError, } from './service.js';
export const ledgerRoutes = new Hono();
// --- Chart of Accounts ---
ledgerRoutes.get('/accounts', async (c) => {
    const rows = await db.select().from(accounts).orderBy(accounts.code);
    return c.json(rows);
});
ledgerRoutes.post('/accounts', async (c) => {
    const body = await c.req.json();
    const [row] = await db.insert(accounts).values(body).returning();
    return c.json(row, 201);
});
// --- Funds / Voteheads ---
ledgerRoutes.get('/funds', async (c) => {
    const rows = await db.select().from(funds).orderBy(funds.code);
    return c.json(rows);
});
ledgerRoutes.post('/funds', async (c) => {
    const body = await c.req.json();
    const [row] = await db.insert(funds).values(body).returning();
    return c.json(row, 201);
});
// --- Fiscal Periods ---
ledgerRoutes.get('/periods', async (c) => {
    const rows = await db.select().from(fiscalPeriods).orderBy(fiscalPeriods.startDate);
    return c.json(rows);
});
ledgerRoutes.post('/periods', async (c) => {
    const body = await c.req.json();
    const [row] = await db.insert(fiscalPeriods).values(body).returning();
    return c.json(row, 201);
});
ledgerRoutes.post('/periods/:id/close', async (c) => {
    const id = Number(c.req.param('id'));
    const [row] = await db
        .update(fiscalPeriods)
        .set({ status: 'closed', closedAt: new Date() })
        .where(eq(fiscalPeriods.id, id))
        .returning();
    if (!row)
        return c.json({ error: 'Not found' }, 404);
    return c.json(row);
});
// --- Journal Entries ---
ledgerRoutes.get('/journal-entries', async (c) => {
    const rows = await db.select().from(journalEntries).orderBy(journalEntries.entryDate);
    return c.json(rows);
});
ledgerRoutes.get('/journal-entries/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!entry)
        return c.json({ error: 'Not found' }, 404);
    const lines = await db.select().from(journalLines).where(eq(journalLines.journalEntryId, id));
    return c.json({ ...entry, lines });
});
// Manual entries require approval before posting (maker-checker).
ledgerRoutes.post('/journal-entries', async (c) => {
    const body = (await c.req.json());
    try {
        const entry = await createManualJournalEntry(body);
        return c.json(entry, 201);
    }
    catch (err) {
        if (err instanceof UnbalancedEntryError || err instanceof PeriodClosedError) {
            return c.json({ error: err.message }, 400);
        }
        throw err;
    }
});
// System modules (fees, payroll, procurement, assets, grants) post directly.
ledgerRoutes.post('/journal-entries/system', async (c) => {
    const body = (await c.req.json());
    try {
        const entry = await postSystemJournalEntry(body);
        return c.json(entry, 201);
    }
    catch (err) {
        if (err instanceof UnbalancedEntryError || err instanceof PeriodClosedError) {
            return c.json({ error: err.message }, 400);
        }
        throw err;
    }
});
ledgerRoutes.post('/journal-entries/:id/approve', async (c) => {
    const id = Number(c.req.param('id'));
    const { approverId } = await c.req.json();
    try {
        const entry = await approveJournalEntry(id, approverId);
        return c.json(entry);
    }
    catch (err) {
        if (err instanceof PeriodClosedError)
            return c.json({ error: err.message }, 400);
        return c.json({ error: err.message }, 400);
    }
});
ledgerRoutes.post('/journal-entries/:id/reject', async (c) => {
    const id = Number(c.req.param('id'));
    const { approverId, reason } = await c.req.json();
    try {
        const entry = await rejectJournalEntry(id, approverId, reason);
        return c.json(entry);
    }
    catch (err) {
        return c.json({ error: err.message }, 400);
    }
});
// --- Reports ---
ledgerRoutes.get('/reports/trial-balance', async (c) => {
    const asOfDate = c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10);
    const fundIdParam = c.req.query('fundId');
    const fundId = fundIdParam ? Number(fundIdParam) : undefined;
    const result = await getTrialBalance({ asOfDate, fundId });
    return c.json(result);
});
