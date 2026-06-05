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

// Crear alumno — el admin/administrativo crea el usuario + perfil alumno
export const createAlumnoSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  dni: z.string().min(7).max(10),
  // El legajo se genera automáticamente en el backend (convención AAAA-NNNN).
  carrera: z.string().min(3),
  anioIngreso: z.coerce.number().int().min(2000).max(2100),
  fechaNacimiento: z.coerce.date(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

// Crear staff (docente o administración). SUPERADMIN no se crea por este flujo.
export const createStaffSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  rol: z.enum([RolUsuario.DOCENTE, RolUsuario.ADMINISTRACION]),
});

export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type ListUsuariosQuery = z.infer<typeof listUsuariosQuerySchema>;
export type CreateAlumnoInput = z.infer<typeof createAlumnoSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
