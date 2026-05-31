import { apiClient } from './client';
import type { Constancia, Paginated, TipoConstancia } from '../types';

export const constanciasApi = {
  list: (params: { alumnoId?: string; page?: number; pageSize?: number } = {}) =>
    apiClient.get<Paginated<Constancia>>('/constancias', { params }).then((r) => r.data),

  create: (data: { alumnoId: string; tipo: TipoConstancia; motivo?: string }) =>
    apiClient.post<Constancia>('/constancias', data).then((r) => r.data),

  /** Descarga el PDF como Blob. */
  downloadPdf: (id: string) =>
    apiClient
      .get(`/constancias/${id}/pdf`, { responseType: 'blob' })
      .then((r) => r.data as Blob),

  verificar: (codigo: string) =>
    apiClient.get(`/constancias/verificar/${codigo}`).then((r) => r.data),
};
