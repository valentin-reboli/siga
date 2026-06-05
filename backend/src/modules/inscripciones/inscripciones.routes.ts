import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { inscripcionesController } from './inscripciones.controller';
import {
  createInscripcionSchema,
  listInscripcionesQuerySchema,
  updateInscripcionSchema,
} from './inscripciones.schemas';

const router = Router();
router.use(authenticate);

// Listar - alumno ve solo las suyas, docente las de sus materias (controller filtra)
router.get('/', validate(listInscripcionesQuerySchema, 'query'), inscripcionesController.list);

// Crear inscripción - alumno (para sí mismo) o staff (controller valida propiedad)
router.post('/', validate(createInscripcionSchema), inscripcionesController.create);

// Cargar nota/estado de cursada - docente (sus materias) o staff
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.INSCRIPCIONES_GRADE),
  validate(updateInscripcionSchema),
  inscripcionesController.update,
);

// Cancelar inscripción - el alumno (la suya) o el staff (controller valida propiedad)
router.delete('/:id', inscripcionesController.cancel);

export const inscripcionesRoutes = router;
