import { z } from 'zod';

// Tipos de publicación válidos (espejo del enum de Prisma).
export const tipoPublicacionEnum = z.enum(['ANUNCIO', 'MATERIAL', 'HILO']);

export const createPublicacionSchema = z.object({
  tipo: tipoPublicacionEnum.default('ANUNCIO'),
  titulo: z.string().min(2, 'El título es muy corto').max(200),
  // En multipart los campos llegan como string; aceptamos hasta 20k caracteres.
  contenido: z.string().min(1, 'El contenido no puede estar vacío').max(20000),
  // Llega como "true"/"false" desde el form-data.
  fijado: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

export const updatePublicacionSchema = z.object({
  titulo: z.string().min(2).max(200).optional(),
  contenido: z.string().min(1).max(20000).optional(),
  tipo: tipoPublicacionEnum.optional(),
  fijado: z.boolean().optional(),
});

export const listPublicacionesQuerySchema = z.object({
  tipo: tipoPublicacionEnum.optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const createComentarioSchema = z.object({
  contenido: z.string().min(1, 'El comentario no puede estar vacío').max(5000),
});

export type CreatePublicacionInput = z.infer<typeof createPublicacionSchema>;
export type UpdatePublicacionInput = z.infer<typeof updatePublicacionSchema>;
export type ListPublicacionesQuery = z.infer<typeof listPublicacionesQuerySchema>;
export type CreateComentarioInput = z.infer<typeof createComentarioSchema>;
