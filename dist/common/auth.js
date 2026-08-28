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
// Ownership check for routes shaped like /:userId/... — having the right
// permission (e.g. portal.access) proves you're SOME guardian, not that
// you're THIS one. Without this, any guardian's token could read any other
// guardian's linked-children data just by changing the URL's :userId (IDOR).
export function requireSelf(paramName) {
    return async (c, next) => {
        const user = c.get('user');
        const routeUserId = Number(c.req.param(paramName));
        if (!user || user.id !== routeUserId) {
            throw new ForbiddenError('You can only access your own records');
        }
        await next();
    };
}
