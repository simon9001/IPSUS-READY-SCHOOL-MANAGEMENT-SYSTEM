import { Hono } from 'hono'
import { requireAuth } from '../../common/auth.js'
import { zValidator } from '../../common/validate.js'
import { authController } from './auth.controller.js'
import { changePasswordSchema, loginSchema, updateProfileSchema } from './auth.schema.js'

export const authRoutes = new Hono()

authRoutes.post('/login', zValidator('json', loginSchema), authController.login)
authRoutes.get('/me', requireAuth(), authController.me)
authRoutes.put('/profile', requireAuth(), zValidator('json', updateProfileSchema), authController.updateProfile)
authRoutes.put('/change-password', requireAuth(), zValidator('json', changePasswordSchema), authController.changePassword)
