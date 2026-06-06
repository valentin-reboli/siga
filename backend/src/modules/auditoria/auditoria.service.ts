import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ListAuditoriaQuery } from './auditoria.schemas';

export const auditoriaService = {
  async list(query: ListAuditoriaQuery) {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.targetId) where.targetId = query.targetId;
    if (query.actorId) where.actorId = query.actorId;
    if (query.accion) where.accion = query.accion;
    if (query.q) {
      where.OR = [
        { descripcion: { contains: query.q, mode: 'insensitive' } },
        { actorEmail: { contains: query.q, mode: 'insensitive' } },
        { targetNombre: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return { total, page: query.page, pageSize: query.pageSize, items };
  },
};
