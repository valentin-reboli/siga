import { apiClient } from './client';
import type { Materia, Paginated } from '../types';

export const materiasApi = {
  list: (
    params: {
      carrera?: string;
      anio?: number;
      activa?: boolean;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) => apiClient.get<Paginated<Materia>>('/materias', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Materia>(`/materias/${id}`).then((r) => r.data),
};
