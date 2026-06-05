import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { usuariosController } from './usuarios.controller';
import {
  listUsuariosQuerySchema,
  updateUsuarioSchema,
  createAlumnoSchema,
  createStaffSchema,
} from './usuarios.schemas';
import { RolUsuario } from '@prisma/client';

const router = Router();
router.use(authenticate);

const onlyAdmin = requireRole(RolUsuario.ADMIN);
const adminOrAdministrativo = requireRole(RolUsuario.ADMIN, RolUsuario.ADMINISTRATIVO);

// Listar y ver usuarios
router.get('/', adminOrAdministrativo, validate(listUsuariosQuerySchema, 'query'), usuariosController.list);
router.get('/:id', adminOrAdministrativo, usuariosController.getById);

// Crear usuarios
router.post('/alumnos', adminOrAdministrativo, validate(createAlumnoSchema), usuariosController.createAlumno);
router.post('/staff', onlyAdmin, validate(createStaffSchema), usuariosController.createStaff);

// Editar / desactivar
router.patch('/:id', onlyAdmin, validate(updateUsuarioSchema), usuariosController.update);
router.delete('/:id', onlyAdmin, usuariosController.deactivate);

// Materias de un docente
router.get('/:id/materias', adminOrAdministrativo, usuariosController.getMaterias);
router.post('/:id/materias', onlyAdmin, usuariosController.assignMateria);
router.delete('/:id/materias/:materiaId', onlyAdmin, usuariosController.removeMateria);

export const usuariosRoutes = router;
