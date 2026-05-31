import { z } from 'zod';
import { EstadoConstancia, TipoConstancia } from '@prisma/client';

export const createConstanciaSchema = z.object({
  alumnoId: z.string().uuid(),
  tipo: z.nativeEnum(TipoConstancia),
  motivo: z.string().optional(),
});

export const updateConstanciaSchema = z.object({
  estado: z.nativeEnum(EstadoConstancia).optional(),
  observaciones: z.string().optional(),
});

export const listConstanciasQuerySchema = z.object({
  alumnoId: z.string().uuid().optional(),
  tipo: z.nativeEnum(TipoConstancia).optional(),
  estado: z.nativeEnum(EstadoConstancia).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateConstanciaInput = z.infer<typeof createConstanciaSchema>;
export type UpdateConstanciaInput = z.infer<typeof updateConstanciaSchema>;
export type ListConstanciasQuery = z.infer<typeof listConstanciasQuerySchema>;
