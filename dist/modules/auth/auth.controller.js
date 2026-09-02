import { authService } from './auth.service.js';
import { ok } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
import { ForbiddenError } from '../../common/errors.js';
export const authController = {
    login: async (c) => ok(c, await authService.login(getValidated(c, 'json'))),
    me: async (c) => {
        const user = c.get('user');
        if (!user)
            throw new ForbiddenError('Not authenticated');
        return ok(c, await authService.me(user.id));
    },
    updateProfile: async (c) => {
        const user = c.get('user');
        if (!user)
            throw new ForbiddenError('Not authenticated');
        return ok(c, await authService.updateProfile(user.id, getValidated(c, 'json')));
    },
    changePassword: async (c) => {
        const user = c.get('user');
        if (!user)
            throw new ForbiddenError('Not authenticated');
        return ok(c, await authService.changePassword(user.id, getValidated(c, 'json')));
    },
};
