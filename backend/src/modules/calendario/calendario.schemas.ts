import { z } from 'zod';

export const listCalendarioQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

export type ListCalendarioQuery = z.infer<typeof listCalendarioQuerySchema>;
