import { apiClient } from './client';
import type { AuditLog, Paginated } from '../types';

export const auditoriaApi = {
  list: (
    params: {
      targetId?: string;
      actorId?: string;
      accion?: string;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) => apiClient.get<Paginated<AuditLog>>('/auditoria', { params }).then((r) => r.data),
};
