import { z } from 'zod';

export const createMateriaSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  anio: z.coerce.number().int().min(1).max(7),
  cuatrimestre: z.coerce.number().int().min(0).max(2),
  cargaHoraria: z.coerce.number().int().min(1),
  cupoMaximo: z.coerce.number().int().min(1).default(40),
  carrera: z.string().min(2),
  // Clave que el docente comparte para inscribirse. Si se omite, el backend usa
  // la derivada del nombre (slug + "123"). Nunca se devuelve en las consultas.
  claveInscripcion: z.string().min(4).optional(),
});

export const updateMateriaSchema = createMateriaSchema.partial().extend({
  activa: z.boolean().optional(),
});

export const listMateriasQuerySchema = z.object({
  carrera: z.string().optional(),
  anio: z.coerce.number().int().optional(),
  activa: z.coerce.boolean().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const correlatividadSchema = z.object({
  requiereId: z.string().uuid(),
  tipo: z.enum(['REGULAR', 'APROBADA']).default('APROBADA'),
});

export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;
export type ListMateriasQuery = z.infer<typeof listMateriasQuerySchema>;
export type CorrelatividadInput = z.infer<typeof correlatividadSchema>;
