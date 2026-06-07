import { apiClient } from './client';
import type { NotaParcial } from '../types';

export const notasApi = {
  /** Crea o actualiza una nota parcial para una inscripción. */
  upsert: (
    inscripcionId: string,
    numero: number,
    data: { tipo?: string; nota: number; observaciones?: string },
  ) =>
    apiClient
      .put<NotaParcial>(`/inscripciones/${inscripcionId}/parciales/${numero}`, data)
      .then((r) => r.data),

  /** Elimina una nota parcial. */
  delete: (inscripcionId: string, numero: number, tipo = 'PARCIAL') =>
    apiClient
      .delete<{ ok: boolean }>(`/inscripciones/${inscripcionId}/parciales/${numero}`, {
        params: { tipo },
      })
      .then((r) => r.data),
};
