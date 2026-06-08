import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { constanciasController } from './constancias.controller';
import {
  createConstanciaSchema,
  listConstanciasQuerySchema,
  updateConstanciaSchema,
} from './constancias.schemas';

const router = Router();

// Verificación pública por código (sin autenticación)
router.get('/verificar/:codigo', constanciasController.verificar);

router.use(authenticate);

router.get('/', validate(listConstanciasQuerySchema, 'query'), constanciasController.list);
router.post('/', validate(createConstanciaSchema), constanciasController.create);
// getById/getPdf validan propiedad en el controller (alumno dueño o staff).
router.get('/:id', constanciasController.getById);
router.get('/:id/pdf', constanciasController.getPdf);

// El alumno puede cancelar su propia solicitud pendiente.
router.delete('/:id', constanciasController.cancelar);

// Gestión (aprobar/rechazar/emitir): SUPERADMIN y ADMINISTRACION.
const canManage = requirePermission(PERMISSIONS.CONSTANCIAS_MANAGE);
router.patch('/:id', canManage, validate(updateConstanciaSchema), constanciasController.update);
router.post('/:id/emitir', canManage, constanciasController.emitir);

export const constanciasRoutes = router;
