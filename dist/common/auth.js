import { ForbiddenError } from './errors.js';
export function requirePermission(code) {
    return async (c, next) => {
        const user = c.get('user');
        if (!user || !user.permissions.includes(code)) {
            throw new ForbiddenError(`Missing required permission: ${code}`);
        }
        await next();
    };
}
// For the handful of routes meant to be readable by any logged-in staff
// member (e.g. school notices) where no dedicated `.view` permission exists
// in the catalog — still blocks unauthenticated requests, unlike leaving the
// route ungated entirely.
export function requireAuth() {
    return async (c, next) => {
        const user = c.get('user');
        if (!user)
            throw new ForbiddenError('Authentication required');
        await next();
    };
}
