import { prisma } from '../config/prisma';

export const AUDIT = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  LOGIN: 'LOGIN',
} as const;

export type AccionAuditoria = (typeof AUDIT)[keyof typeof AUDIT];

export interface AuditInput {
  accion: AccionAuditoria | string;
  actorId?: string | null;
  actorEmail?: string | null;
  targetId?: string | null;
  targetNombre?: string | null;
  descripcion: string;
  ip?: string | null;
}

/**
 * Registra una entrada de auditoría. Nunca lanza: si falla el log, no debe
 * romper la operación principal (solo lo deja en consola).
 */
export async function registrarAuditoria(data: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        accion: data.accion,
        actorId: data.actorId ?? null,
        actorEmail: data.actorEmail ?? null,
        targetId: data.targetId ?? null,
        targetNombre: data.targetNombre ?? null,
        descripcion: data.descripcion,
        ip: data.ip ?? null,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] No se pudo registrar la acción', data.accion, err);
  }
}
