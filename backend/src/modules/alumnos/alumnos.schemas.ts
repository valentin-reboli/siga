import { z } from 'zod';
import { EstadoAlumno } from '@prisma/client';

export const createAlumnoSchema = z.object({
  // Datos del usuario (se crea junto con el alumno)
  email: z.string().email(),
  password: z.string().min(8),
  // Datos del alumno
  legajo: z.string().min(1),
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

export const listAlumnosQuerySchema = z.object({
  estado: z.nativeEnum(EstadoAlumno).optional(),
  carrera: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAlumnoInput = z.infer<typeof createAlumnoSchema>;
export type UpdateAlumnoInput = z.infer<typeof updateAlumnoSchema>;
export type ListAlumnosQuery = z.infer<typeof listAlumnosQuerySchema>;
