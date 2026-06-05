import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { materiasController } from './materias.controller';
import {
  correlatividadSchema,
  createMateriaSchema,
  listMateriasQuerySchema,
  updateMateriaSchema,
} from './materias.schemas';

const router = Router();
router.use(authenticate);

// CRUD de materias y correlatividades: solo SUPERADMIN (MATERIAS_MANAGE).
const canManage = requirePermission(PERMISSIONS.MATERIAS_MANAGE);

// Cualquier usuario autenticado puede ver el catálogo
router.get('/', validate(listMateriasQuerySchema, 'query'), materiasController.list);
router.get('/:id', materiasController.getById);

router.post('/', canManage, validate(createMateriaSchema), materiasController.create);
router.patch('/:id', canManage, validate(updateMateriaSchema), materiasController.update);

// Correlatividades
router.post(
  '/:id/correlatividades',
  canManage,
  validate(correlatividadSchema),
  materiasController.addCorrelatividad,
);
router.delete(
  '/:id/correlatividades/:correlatividadId',
  canManage,
  materiasController.removeCorrelatividad,
);

export const materiasRoutes = router;
