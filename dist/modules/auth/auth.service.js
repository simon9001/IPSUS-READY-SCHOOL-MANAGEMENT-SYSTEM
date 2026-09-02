import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { hashPassword, verifyPassword } from '../identity/password.js';
import { uploadToCloudinary } from '../../common/cloudinary.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';
// Fails fast at startup rather than silently signing tokens with a fallback
// secret that would otherwise sit in source control — see .env.example for
// how to generate one.
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Add it to .env — see .env.example.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '8h';
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
async function toAuthenticatedUser(user) {
    const { roles, permissions } = await authRepository.findRolesAndPermissions(user.id);
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles,
        permissions,
    };
}
export const authService = {
    async login(input) {
        const user = await authRepository.findUserByEmail(input.email);
        if (!user)
            throw new ValidationError('Invalid email or password');
        if (user.status !== 'active')
            throw new ForbiddenError(`Account is ${user.status}`);
        if (user.lockedUntil && user.lockedUntil > new Date())
            throw new ForbiddenError('Account is temporarily locked');
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
            const attempts = user.failedLoginAttempts + 1;
            const lockedUntil = attempts >= MAX_FAILED_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;
            await authRepository.recordFailedLogin(user.id, attempts, lockedUntil);
            if (lockedUntil)
                throw new ForbiddenError(`Too many failed attempts — account locked for 15 minutes`);
            throw new ValidationError('Invalid email or password');
        }
        await authRepository.recordLogin(user.id);
        const authenticatedUser = await toAuthenticatedUser(user);
        const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
        return { token, user: authenticatedUser };
    },
    verifyToken(token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'string' || typeof decoded.sub !== 'number')
            throw new Error('Invalid token payload');
        return { sub: decoded.sub };
    },
    async me(userId) {
        const user = await authRepository.findUserById(userId);
        if (!user)
            throw new NotFoundError(`User ${userId} not found`);
        return toAuthenticatedUser(user);
    },
    async updateProfile(userId, input) {
        const user = await authRepository.findUserById(userId);
        if (!user)
            throw new NotFoundError(`User ${userId} not found`);
        let finalAvatarUrl = input.avatarUrl;
        // If an image data URI is sent, upload it to Cloudinary and store the secure HTTPS CDN link
        if (input.avatarUrl && input.avatarUrl.startsWith('data:image/')) {
            finalAvatarUrl = await uploadToCloudinary(input.avatarUrl, 'school_passports');
        }
        const updated = await authRepository.updateUser(userId, {
            fullName: input.fullName?.trim() || undefined,
            phone: input.phone?.trim() || undefined,
            avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : undefined,
        });
        return toAuthenticatedUser(updated);
    },
    async changePassword(userId, input) {
        const user = await authRepository.findUserById(userId);
        if (!user)
            throw new NotFoundError(`User ${userId} not found`);
        const valid = await verifyPassword(input.currentPassword, user.passwordHash);
        if (!valid)
            throw new ValidationError('Current password does not match');
        const newHash = await hashPassword(input.newPassword);
        await authRepository.updatePassword(userId, newHash);
        return { message: 'Password changed successfully' };
    },
};
