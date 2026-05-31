import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, registerSchema } from './auth.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();

// Login público
router.post('/login', validate(loginSchema), authController.login);

// Registro: solo ADMIN o ADMINISTRATIVO pueden crear cuentas institucionales
router.post(
  '/register',
  authenticate,
  requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO),
  validate(registerSchema),
  authController.register,
);

// Información del usuario autenticado
router.get('/me', authenticate, authController.me);

export const authRoutes = router;
