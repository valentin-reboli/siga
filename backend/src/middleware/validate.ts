import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Valida una sección de la request contra un schema de Zod.
 * Sustituye el contenido validado (con sus coerciones) en la request.
 */
export function validate<T>(schema: ZodSchema<T>, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }
    // Asignamos el dato parseado
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
}
