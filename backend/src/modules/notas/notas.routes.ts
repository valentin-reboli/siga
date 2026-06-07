import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { notasController } from './notas.controller';

// mergeParams: true para acceder a :id (inscripcionId) del router padre
const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.INSCRIPCIONES_GRADE));

// PUT /inscripciones/:id/parciales/:numero  — crea o actualiza nota parcial
router.put('/:numero', notasController.upsert);

// DELETE /inscripciones/:id/parciales/:numero?tipo=PARCIAL — elimina nota parcial
router.delete('/:numero', notasController.delete);

export const notasRoutes = router;
