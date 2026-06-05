import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { HttpError } from '../utils/httpError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Errores conocidos de la app
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  // Errores de validación zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Errores de subida de archivos (multer)
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño máximo permitido'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Demasiados archivos en una sola publicación'
          : `Error al subir archivo: ${err.message}`;
    res.status(413).json({ error: msg });
    return;
  }

  // Errores conocidos de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Ya existe un registro con esos valores únicos',
        details: err.meta,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.status(400).json({ error: 'Error de base de datos', code: err.code });
    return;
  }

  // Cualquier otro error
  // eslint-disable-next-line no-console
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
