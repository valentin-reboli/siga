import { apiClient } from './client';
import type { Inscripcion, Paginated, TipoInscripcion } from '../types';

export const inscripcionesApi = {
  list: (
    params: {
      alumnoId?: string;
      materiaId?: string;
      tipo?: TipoInscripcion;
      cicloLectivo?: number;
      page?: number;
      pageSize?: number;
    } = {},
  ) => apiClient.get<Paginated<Inscripcion>>('/inscripciones', { params }).then((r) => r.data),

  create: (data: {
    alumnoId: string;
    materiaId: string;
    tipo: TipoInscripcion;
    cicloLectivo: number;
    fechaExamen?: string;
  }) => apiClient.post<Inscripcion>('/inscripciones', data).then((r) => r.data),

  update: (
    id: string,
    data: { estado?: string; estadoCursada?: string; nota?: number; observaciones?: string },
  ) => apiClient.patch<Inscripcion>(`/inscripciones/${id}`, data).then((r) => r.data),

  cancel: (id: string) =>
    apiClient.delete<Inscripcion>(`/inscripciones/${id}`).then((r) => r.data),
};
