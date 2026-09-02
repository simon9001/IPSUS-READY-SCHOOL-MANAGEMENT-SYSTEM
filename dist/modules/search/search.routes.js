import { Hono } from 'hono';
import { searchService } from './search.service.js';
import { ok } from '../../common/response.js';
export const searchRoutes = new Hono();
searchRoutes.get('/', async (c) => {
    const query = c.req.query('q') ?? '';
    const user = c.get('user');
    if (!user || !query) {
        return ok(c, []);
    }
    const results = await searchService.search(query, {
        id: user.id,
        permissions: user.permissions ?? [],
    });
    return ok(c, results);
});
