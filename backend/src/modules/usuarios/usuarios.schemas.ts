import { z } from 'zod';
import { RolUsuario } from '@prisma/client';

export const updateUsuarioSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  rol: z.nativeEnum(RolUsuario).optional(),
  activo: z.boolean().optional(),
});

export const listUsuariosQuerySchema = z.object({
  rol: z.nativeEnum(RolUsuario).optional(),
  activo: z.coerce.boolean().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type ListUsuariosQuery = z.infer<typeof listUsuariosQuerySchema>;
