import { authService } from './auth.service.js';
/**
 * Decodes a Bearer token if present and attaches the user's id+permissions
 * to the request context — this is what makes common/auth.ts's
 * requirePermission() actually functional. Never blocks the request itself
 * (no token / an invalid token just means c.get('user') stays undefined);
 * routes that need to require a permission attach requirePermission(code)
 * themselves, same as always.
 */
export async function attachUser(c, next) {
    const header = c.req.header('Authorization');
    if (header?.startsWith('Bearer ')) {
        try {
            const payload = authService.verifyToken(header.slice('Bearer '.length));
            const user = await authService.me(payload.sub);
            c.set('user', { id: user.id, permissions: user.permissions });
        }
        catch {
            // invalid/expired token — treated as unauthenticated, not an error
        }
    }
    await next();
}
