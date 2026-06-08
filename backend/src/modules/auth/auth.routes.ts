import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { rateLimit } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schemas';

const router = Router();

// Login público — con rate limit para mitigar fuerza bruta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP por ventana
  message: 'Demasiados intentos de inicio de sesión. Esperá unos minutos.',
});
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// Registro genérico: solo SUPERADMIN (evita escalada de privilegios).
// El alta normal de usuarios va por /api/usuarios (alumnos/staff).
router.post(
  '/register',
  authenticate,
  requirePermission(PERMISSIONS.USERS_CREATE_STAFF),
  validate(registerSchema),
  authController.register,
);

// Información del usuario autenticado
router.get('/me', authenticate, authController.me);

// Cambio de contraseña (usuario autenticado).
router.patch('/me/password', authenticate, validate(changePasswordSchema), authController.changePassword);

export const authRoutes = router;
