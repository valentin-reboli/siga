import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { alumnosController } from './alumnos.controller';
import {
  createAlumnoSchema,
  listAlumnosQuerySchema,
  updateAlumnoSchema,
  updateMyContactSchema,
} from './alumnos.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();
router.use(authenticate);

// El alumno consulta y actualiza sus propios datos de contacto
router.get('/me', requireRole(RolUsuario.ALUMNO), alumnosController.myProfile);
router.patch(
  '/me',
  requireRole(RolUsuario.ALUMNO),
  validate(updateMyContactSchema),
  alumnosController.updateMyContact,
);

router.get(
  '/',
  requirePermission(PERMISSIONS.STUDENTS_VIEW),
  validate(listAlumnosQuerySchema, 'query'),
  alumnosController.list,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.STUDENTS_CREATE),
  validate(createAlumnoSchema),
  alumnosController.create,
);

// Antes cualquier autenticado podía leer el registro completo (DNI, dirección)
// de cualquier alumno -> IDOR. Ahora requiere STUDENTS_VIEW.
router.get('/:id', requirePermission(PERMISSIONS.STUDENTS_VIEW), alumnosController.getById);

// El legajo lo ve el propio alumno o el staff (lógica en el controller).
router.get('/:id/legajo', alumnosController.getLegajo);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.STUDENTS_UPDATE),
  validate(updateAlumnoSchema),
  alumnosController.update,
);

export const alumnosRoutes = router;
