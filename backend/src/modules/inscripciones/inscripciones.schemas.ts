import { z } from 'zod';
import { EstadoCursada, EstadoInscripcion, TipoInscripcion } from '@prisma/client';

export const createInscripcionSchema = z.object({
  alumnoId: z.string().uuid(),
  materiaId: z.string().uuid(),
  tipo: z.nativeEnum(TipoInscripcion),
  cicloLectivo: z.coerce.number().int().min(2000).max(2100),
  fechaExamen: z.coerce.date().optional(),
});

export const updateInscripcionSchema = z.object({
  estado: z.nativeEnum(EstadoInscripcion).optional(),
  estadoCursada: z.nativeEnum(EstadoCursada).optional(),
  nota: z.coerce.number().min(0).max(10).optional(),
  observaciones: z.string().optional(),
});

export const listInscripcionesQuerySchema = z.object({
  alumnoId: z.string().uuid().optional(),
  materiaId: z.string().uuid().optional(),
  tipo: z.nativeEnum(TipoInscripcion).optional(),
  estado: z.nativeEnum(EstadoInscripcion).optional(),
  cicloLectivo: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateInscripcionInput = z.infer<typeof createInscripcionSchema>;
export type UpdateInscripcionInput = z.infer<typeof updateInscripcionSchema>;
export type ListInscripcionesQuery = z.infer<typeof listInscripcionesQuerySchema>;
