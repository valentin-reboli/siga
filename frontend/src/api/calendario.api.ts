import { apiClient } from './client';
import type { EventoCalendario } from '../types';

export const calendarioApi = {
  // Eventos del usuario en un rango de fechas (ISO).
  list: (params: { desde?: string; hasta?: string } = {}) =>
    apiClient
      .get<{ eventos: EventoCalendario[] }>('/calendario', { params })
      .then((r) => r.data.eventos),
};
