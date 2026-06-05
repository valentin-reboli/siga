import type { RolUsuario } from '../types';

// Espejo (simplificado) del RBAC del backend, para decidir qué muestra la UI.
// La autorización real siempre la valida el backend; esto es solo presentación.

export const ROLES: Record<RolUsuario, RolUsuario> = {
  SUPERADMIN: 'SUPERADMIN',
  ADMINISTRACION: 'ADMINISTRACION',
  DOCENTE: 'DOCENTE',
  ALUMNO: 'ALUMNO',
};

export const ROL_LABEL: Record<RolUsuario, string> = {
  SUPERADMIN: 'Superadministrador',
  ADMINISTRACION: 'Administración',
  DOCENTE: 'Docente',
  ALUMNO: 'Alumno',
};

/** Staff administrativo (no alumno, no docente). */
export function isStaff(rol?: RolUsuario): boolean {
  return rol === 'SUPERADMIN' || rol === 'ADMINISTRACION';
}

export function isSuperadmin(rol?: RolUsuario): boolean {
  return rol === 'SUPERADMIN';
}

/** Puede gestionar (aprobar/rechazar/emitir) constancias. */
export function canManageConstancias(rol?: RolUsuario): boolean {
  return isStaff(rol);
}

/** Puede crear/editar materias y carreras (CRUD del plan). */
export function canManageMaterias(rol?: RolUsuario): boolean {
  return isSuperadmin(rol);
}

/** Puede acceder a la gestión de usuarios. */
export function canManageUsuarios(rol?: RolUsuario): boolean {
  return isStaff(rol);
}
