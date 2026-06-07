import { z } from 'zod';

export const upsertParcialSchema = z.object({
  tipo: z.string().default('PARCIAL'),
  nota: z.coerce.number().min(0).max(10),
  observaciones: z.string().max(500).optional(),
});

export type UpsertParcialInput = z.infer<typeof upsertParcialSchema>;
