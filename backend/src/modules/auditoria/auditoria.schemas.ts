import { z } from 'zod';

export const listAuditoriaQuerySchema = z.object({
  targetId: z.string().optional(),
  actorId: z.string().optional(),
  accion: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListAuditoriaQuery = z.infer<typeof listAuditoriaQuerySchema>;
