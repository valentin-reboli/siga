import { z } from 'zod';

// Fecha de clase en formato YYYY-MM-DD (sin hora).
const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (se espera YYYY-MM-DD)');

export const estadoAsistenciaSchema = z.enum(['PRESENTE', 'AUSENTE', 'JUSTIFICADO']);

// Query para traer el roster de una materia (opcionalmente con el estado ya
// cargado para una fecha puntual).
export const rosterQuerySchema = z.object({
  cicloLectivo: z.coerce.number().int().min(2000).max(2100),
  fecha: fechaSchema.optional(),
});

// Guardar la asistencia de una clase: una fecha + el estado de cada alumno.
export const guardarAsistenciaSchema = z.object({
  fecha: fechaSchema,
  cicloLectivo: z.coerce.number().int().min(2000).max(2100),
  registros: z
    .array(
      z.object({
        inscripcionId: z.string().uuid(),
        estado: estadoAsistenciaSchema,
      }),
    )
    .min(1, 'No hay registros de asistencia para guardar'),
});

// Query para resumen / historial de clases de una materia.
export const cicloQuerySchema = z.object({
  cicloLectivo: z.coerce.number().int().min(2000).max(2100),
});

export type RosterQuery = z.infer<typeof rosterQuerySchema>;
export type GuardarAsistenciaInput = z.infer<typeof guardarAsistenciaSchema>;
export type CicloQuery = z.infer<typeof cicloQuerySchema>;
