import { z } from 'zod';
import { EstadoAlumno } from '@prisma/client';

export const createAlumnoSchema = z.object({
  // Datos del usuario (se crea junto con el alumno)
  email: z.string().email(),
  password: z.string().min(8),
  // Datos del alumno (el legajo se genera automáticamente: AAAA-NNNN)
  dni: z.string().min(7).max(10),
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  fechaNacimiento: z.coerce.date(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  carrera: z.string().min(2),
  anioIngreso: z.coerce.number().int().min(1990).max(2100),
});

export const updateAlumnoSchema = z.object({
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  carrera: z.string().min(2).optional(),
  estado: z.nativeEnum(EstadoAlumno).optional(),
});

/** Schema reducido para que el propio alumno actualice sus datos de contacto. */
export const updateMyContactSchema = z.object({
  telefono: z.string().max(20).optional(),
  direccion: z.string().max(200).optional(),
});

export const listAlumnosQuerySchema = z.object({
  estado: z.nativeEnum(EstadoAlumno).optional(),
  carrera: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAlumnoInput = z.infer<typeof createAlumnoSchema>;
export type UpdateAlumnoInput = z.infer<typeof updateAlumnoSchema>;
export type UpdateMyContactInput = z.infer<typeof updateMyContactSchema>;
export type ListAlumnosQuery = z.infer<typeof listAlumnosQuerySchema>;
