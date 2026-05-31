import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { inscripcionesController } from './inscripciones.controller';
import {
  createInscripcionSchema,
  listInscripcionesQuerySchema,
  updateInscripcionSchema,
} from './inscripciones.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();
router.use(authenticate);

// Listar - alumno ve solo las suyas (el controller filtra)
router.get('/', validate(listInscripcionesQuerySchema, 'query'), inscripcionesController.list);

// Crear inscripción - alumno o staff
router.post('/', validate(createInscripcionSchema), inscripcionesController.create);

// Cargar nota/estado de cursada - solo docente/staff
router.patch(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO, RolUsuario.DOCENTE),
  validate(updateInscripcionSchema),
  inscripcionesController.update,
);

// Cancelar inscripción - el alumno o el staff
router.delete('/:id', inscripcionesController.cancel);

export const inscripcionesRoutes = router;
