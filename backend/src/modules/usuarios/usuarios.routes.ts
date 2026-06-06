import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { usuariosController } from './usuarios.controller';
import {
  listUsuariosQuerySchema,
  updateUsuarioSchema,
  createAlumnoSchema,
  createStaffSchema,
  updateAvatarSchema,
} from './usuarios.schemas';

const router = Router();
router.use(authenticate);

// Foto de perfil del propio usuario (cualquier rol autenticado).
router.put('/me/avatar', validate(updateAvatarSchema), usuariosController.updateAvatar);
router.delete('/me/avatar', usuariosController.removeAvatar);

// Listar y ver usuarios
router.get('/', requirePermission(PERMISSIONS.USERS_VIEW), validate(listUsuariosQuerySchema, 'query'), usuariosController.list);
router.get('/:id', requirePermission(PERMISSIONS.USERS_VIEW), usuariosController.getById);

// Crear usuarios
router.post('/alumnos', requirePermission(PERMISSIONS.USERS_CREATE_ALUMNO), validate(createAlumnoSchema), usuariosController.createAlumno);
router.post('/staff', requirePermission(PERMISSIONS.USERS_CREATE_STAFF), validate(createStaffSchema), usuariosController.createStaff);

// Editar / desactivar (suspender) — SUPERADMIN y ADMINISTRACION (con guards).
router.patch('/:id', requirePermission(PERMISSIONS.USERS_UPDATE), validate(updateUsuarioSchema), usuariosController.update);
router.delete('/:id', requirePermission(PERMISSIONS.USERS_UPDATE), usuariosController.deactivate);

// Reactivar y restablecer contraseña.
router.post('/:id/reactivar', requirePermission(PERMISSIONS.USERS_UPDATE), usuariosController.reactivate);
router.post('/:id/reset-password', requirePermission(PERMISSIONS.USERS_RESET_PASSWORD), usuariosController.resetPassword);

// Materias de un docente. La autorización (propio o staff) se resuelve en el
// controller para que un docente pueda ver SUS propias asignaciones.
router.get('/:id/materias', usuariosController.getMaterias);
router.post('/:id/materias', requirePermission(PERMISSIONS.USERS_ASSIGN_MATERIA), usuariosController.assignMateria);
router.delete('/:id/materias/:materiaId', requirePermission(PERMISSIONS.USERS_ASSIGN_MATERIA), usuariosController.removeMateria);

export const usuariosRoutes = router;
