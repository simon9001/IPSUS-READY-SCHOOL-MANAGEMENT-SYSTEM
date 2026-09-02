import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { authController } from './auth.controller.js';
import { changePasswordSchema, loginSchema, updateProfileSchema } from './auth.schema.js';
export const authRoutes = new Hono();
authRoutes.post('/login', zValidator('json', loginSchema), authController.login);
authRoutes.get('/me', authController.me);
authRoutes.put('/profile', zValidator('json', updateProfileSchema), authController.updateProfile);
authRoutes.put('/change-password', zValidator('json', changePasswordSchema), authController.changePassword);
