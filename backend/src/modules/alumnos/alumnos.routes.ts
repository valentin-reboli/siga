import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { alumnosController } from './alumnos.controller';
import {
  createAlumnoSchema,
  listAlumnosQuerySchema,
  updateAlumnoSchema,
} from './alumnos.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();
router.use(authenticate);

// El alumno consulta su propio perfil
router.get('/me', requireRole(RolUsuario.ALUMNO), alumnosController.myProfile);

router.get(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO, RolUsuario.PRECEPTOR),
  validate(listAlumnosQuerySchema, 'query'),
  alumnosController.list,
);

router.post(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO),
  validate(createAlumnoSchema),
  alumnosController.create,
);

router.get('/:id', alumnosController.getById);

router.get('/:id/legajo', alumnosController.getLegajo);

router.patch(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO),
  validate(updateAlumnoSchema),
  alumnosController.update,
);

export const alumnosRoutes = router;
