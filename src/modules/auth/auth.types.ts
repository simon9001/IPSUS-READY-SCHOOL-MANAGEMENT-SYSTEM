export interface AuthenticatedUser {
  id: number
  email: string
  fullName: string
  phone?: string | null
  avatarUrl?: string | null
  status?: string
  lastLoginAt?: Date | string | null
  createdAt?: Date | string
  roles: string[]
  permissions: string[]
}

export interface LoginResult {
  token: string
  user: AuthenticatedUser
}

export interface AppTokenPayload {
  sub: number
}
