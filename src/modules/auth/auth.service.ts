import jwt from 'jsonwebtoken'
import { authRepository } from './auth.repository.js'
import { verifyPassword } from '../identity/password.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js'
import type { LoginInput } from './auth.schema.js'
import type { AppTokenPayload, AuthenticatedUser, LoginResult } from './auth.types.js'

// Dev-only fallback — set a real JWT_SECRET in .env before any real deployment.
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me'
const TOKEN_TTL = '8h'

async function toAuthenticatedUser(userId: number, email: string, fullName: string): Promise<AuthenticatedUser> {
  const { roles, permissions } = await authRepository.findRolesAndPermissions(userId)
  return { id: userId, email, fullName, roles, permissions }
}

export const authService = {
  async login(input: LoginInput): Promise<LoginResult> {
    const user = await authRepository.findUserByEmail(input.email)
    if (!user) throw new ValidationError('Invalid email or password')

    if (user.status !== 'active') throw new ForbiddenError(`Account is ${user.status}`)
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new ForbiddenError('Account is temporarily locked')

    const valid = await verifyPassword(input.password, user.passwordHash)
    if (!valid) throw new ValidationError('Invalid email or password')

    await authRepository.recordLogin(user.id)
    const authenticatedUser = await toAuthenticatedUser(user.id, user.email, user.fullName)
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL })

    return { token, user: authenticatedUser }
  },

  verifyToken(token: string): AppTokenPayload {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === 'string' || typeof decoded.sub !== 'number') throw new Error('Invalid token payload')
    return { sub: decoded.sub }
  },

  async me(userId: number): Promise<AuthenticatedUser> {
    const user = await authRepository.findUserById(userId)
    if (!user) throw new NotFoundError(`User ${userId} not found`)
    return toAuthenticatedUser(user.id, user.email, user.fullName)
  },
}
