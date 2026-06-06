import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';
import { HttpError } from '../utils/httpError';

/**
 * ============================================================================
 *  RBAC central de SIGA
 * ============================================================================
 *  Única fuente de verdad de "qué puede hacer cada rol".
 *  En lugar de repetir `requireRole(ADMIN, ADMINISTRATIVO, ...)` en cada
 *  archivo de rutas (que se desincronizaba), definimos permisos atómicos y
 *  un mapa rol -> permisos. Las rutas piden permisos, no roles.
 *
 *  Roles (consolidados a 4):
 *    SUPERADMIN     -> control total (God Mode)
 *    ADMINISTRACION -> gestión académica + preceptoría
 *    DOCENTE        -> acotado a sus materias asignadas
 *    ALUMNO         -> su propia información
 * ============================================================================
 */

export const PERMISSIONS = {
  // Usuarios
  USERS_VIEW: 'users:view',
  USERS_CREATE_ALUMNO: 'users:create_alumno',
  USERS_CREATE_STAFF: 'users:create_staff',
  USERS_UPDATE: 'users:update',
  USERS_RESET_PASSWORD: 'users:reset_password',
  USERS_ASSIGN_MATERIA: 'users:assign_materia',

  // Auditoría: ver el registro de actividad sobre usuarios.
  AUDIT_VIEW: 'audit:view',

  // Alumnos (perfil académico)
  STUDENTS_VIEW: 'students:view',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_UPDATE: 'students:update',

  // Materias / plan de estudios
  MATERIAS_MANAGE: 'materias:manage',

  // Inscripciones y calificaciones
  INSCRIPCIONES_VIEW_ALL: 'inscripciones:view_all',
  INSCRIPCIONES_GRADE: 'inscripciones:grade',

  // Constancias
  CONSTANCIAS_MANAGE: 'constancias:manage',

  // Foro / aula virtual de cada materia.
  // Habilita publicar, comentar y subir material. El controller acota al
  // DOCENTE a sus materias asignadas; el staff puede publicar en cualquiera.
  MATERIA_FORO_PUBLISH: 'materia_foro:publish',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Matriz rol -> permisos.
 * SUPERADMIN recibe todos los permisos automáticamente (ver abajo).
 */
const ROLE_PERMISSIONS: Record<RolUsuario, Permission[]> = {
  [RolUsuario.SUPERADMIN]: Object.values(PERMISSIONS),

  [RolUsuario.ADMINISTRACION]: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE_ALUMNO,
    PERMISSIONS.USERS_CREATE_STAFF,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_RESET_PASSWORD,
    PERMISSIONS.USERS_ASSIGN_MATERIA,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.MATERIAS_MANAGE,
    PERMISSIONS.INSCRIPCIONES_VIEW_ALL,
    PERMISSIONS.INSCRIPCIONES_GRADE,
    PERMISSIONS.CONSTANCIAS_MANAGE,
    PERMISSIONS.MATERIA_FORO_PUBLISH,
  ],

  [RolUsuario.DOCENTE]: [
    // El docente puede calificar, pero el controller lo acota a SUS materias.
    PERMISSIONS.INSCRIPCIONES_GRADE,
    // Publica en el foro de SUS materias (ownership check en el controller).
    PERMISSIONS.MATERIA_FORO_PUBLISH,
  ],

  [RolUsuario.ALUMNO]: [
    // El alumno opera sobre sí mismo vía checks de propiedad en los controllers.
  ],
};

/** ¿El rol tiene el permiso indicado? */
export function hasPermission(rol: RolUsuario, permission: Permission): boolean {
  return ROLE_PERMISSIONS[rol]?.includes(permission) ?? false;
}

/** ¿El rol es staff administrativo (no alumno, no docente)? */
export function isStaff(rol: RolUsuario): boolean {
  return rol === RolUsuario.SUPERADMIN || rol === RolUsuario.ADMINISTRACION;
}

/**
 * Middleware: exige que el usuario autenticado tenga TODOS los permisos pasados.
 * Se usa después de `authenticate`.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(HttpError.unauthorized());
    }
    const ok = permissions.every((p) => hasPermission(req.user!.rol, p));
    if (!ok) {
      return next(HttpError.forbidden('Permisos insuficientes para esta operación'));
    }
    next();
  };
}
