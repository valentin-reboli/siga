import { apiClient } from './client';
import type { Alumno, Legajo, Paginated } from '../types';

export const alumnosApi = {
  me: () => apiClient.get<Alumno>('/alumnos/me').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Alumno>(`/alumnos/${id}`).then((r) => r.data),

  list: (params: { q?: string; carrera?: string; page?: number; pageSize?: number } = {}) =>
    apiClient.get<Paginated<Alumno>>('/alumnos', { params }).then((r) => r.data),

  getLegajo: (id: string) =>
    apiClient.get<Legajo>(`/alumnos/${id}/legajo`).then((r) => r.data),
};
