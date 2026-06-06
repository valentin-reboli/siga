import { apiClient } from './client';
import type { Paginated, RolUsuario, Usuario } from '../types';

export interface CreateAlumnoPayload {
  nombre: string; apellido: string; email: string;
  dni: string; carrera: string;
  anioIngreso: number; fechaNacimiento: string;
  telefono?: string; direccion?: string;
}

export interface CreateStaffPayload {
  nombre: string; apellido: string; email: string;
  rol: 'DOCENTE' | 'ADMINISTRACION';
}

export interface CreatedUserResult {
  alumno?: { legajo: string; carrera: string; usuario: Usuario };
  usuario?: Usuario;
  passwordTemporal: string;
}

export const usuariosApi = {
  list: (params: { rol?: RolUsuario; q?: string; page?: number; pageSize?: number } = {}) =>
    apiClient.get<Paginated<Usuario>>('/usuarios', { params }).then((r) => r.data),

  createAlumno: (data: CreateAlumnoPayload) =>
    apiClient.post<CreatedUserResult>('/usuarios/alumnos', data).then((r) => r.data),

  createStaff: (data: CreateStaffPayload) =>
    apiClient.post<CreatedUserResult>('/usuarios/staff', data).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.delete<Usuario>(`/usuarios/${id}`).then((r) => r.data),

  assignMateria: (docenteId: string, materiaId: string) =>
    apiClient.post(`/usuarios/${docenteId}/materias`, { materiaId }).then((r) => r.data),

  removeMateria: (docenteId: string, materiaId: string) =>
    apiClient.delete(`/usuarios/${docenteId}/materias/${materiaId}`).then((r) => r.data),

  getMaterias: (docenteId: string) =>
    apiClient.get(`/usuarios/${docenteId}/materias`).then((r) => r.data),

  // Foto de perfil del usuario autenticado.
  updateAvatar: (avatar: string) =>
    apiClient
      .put<{ id: string; avatarUrl: string | null }>('/usuarios/me/avatar', { avatar })
      .then((r) => r.data),

  removeAvatar: () =>
    apiClient
      .delete<{ id: string; avatarUrl: string | null }>('/usuarios/me/avatar')
      .then((r) => r.data),
};
