import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { usuariosController } from './usuarios.controller';
import { listUsuariosQuerySchema, updateUsuarioSchema } from './usuarios.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO),
  validate(listUsuariosQuerySchema, 'query'),
  usuariosController.list,
);

router.get(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO),
  usuariosController.getById,
);

router.patch(
  '/:id',
  requireRole(RolUsuario.ADMIN),
  validate(updateUsuarioSchema),
  usuariosController.update,
);

router.delete(
  '/:id',
  requireRole(RolUsuario.ADMIN),
  usuariosController.deactivate,
);

export const usuariosRoutes = router;
