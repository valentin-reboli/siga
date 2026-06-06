import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { auditoriaController } from './auditoria.controller';
import { listAuditoriaQuerySchema } from './auditoria.schemas';

const router = Router();
router.use(authenticate);

// Registro de auditoría: SUPERADMIN y ADMINISTRACION.
router.get(
  '/',
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  validate(listAuditoriaQuerySchema, 'query'),
  auditoriaController.list,
);

export { router as auditoriaRoutes };
