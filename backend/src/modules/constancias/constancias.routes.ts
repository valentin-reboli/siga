import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { constanciasController } from './constancias.controller';
import {
  createConstanciaSchema,
  listConstanciasQuerySchema,
  updateConstanciaSchema,
} from './constancias.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();

// Verificación pública por código (sin autenticación)
router.get('/verificar/:codigo', constanciasController.verificar);

router.use(authenticate);

router.get('/', validate(listConstanciasQuerySchema, 'query'), constanciasController.list);
router.post('/', validate(createConstanciaSchema), constanciasController.create);
router.get('/:id', constanciasController.getById);
router.get('/:id/pdf', constanciasController.getPdf);

// Emisión y actualización: solo staff
const staff = requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO);
router.patch('/:id', staff, validate(updateConstanciaSchema), constanciasController.update);
router.post('/:id/emitir', staff, constanciasController.emitir);

export const constanciasRoutes = router;
