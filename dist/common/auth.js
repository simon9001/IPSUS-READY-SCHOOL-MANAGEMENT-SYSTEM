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
