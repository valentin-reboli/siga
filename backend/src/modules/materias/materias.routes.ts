import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { materiasController } from './materias.controller';
import {
  correlatividadSchema,
  createMateriaSchema,
  listMateriasQuerySchema,
  updateMateriaSchema,
} from './materias.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();
router.use(authenticate);

const staff = requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO);

// Cualquier usuario autenticado puede ver el catálogo
router.get('/', validate(listMateriasQuerySchema, 'query'), materiasController.list);
router.get('/:id', materiasController.getById);

router.post('/', staff, validate(createMateriaSchema), materiasController.create);
router.patch('/:id', staff, validate(updateMateriaSchema), materiasController.update);

// Correlatividades
router.post(
  '/:id/correlatividades',
  staff,
  validate(correlatividadSchema),
  materiasController.addCorrelatividad,
);
router.delete(
  '/:id/correlatividades/:correlatividadId',
  staff,
  materiasController.removeCorrelatividad,
);

export const materiasRoutes = router;
