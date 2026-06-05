import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { Request } from 'express';
import { env } from '../../config/env';
import { HttpError } from '../../utils/httpError';

/**
 * ============================================================================
 *  Storage de archivos del foro
 * ============================================================================
 *  Los archivos se guardan en disco (env.UPLOAD_DIR). En Railway ese path debe
 *  apuntar a un Volume persistente; de lo contrario los archivos se pierden en
 *  cada deploy.
 *
 *  Seguridad:
 *    - El nombre en disco es un UUID aleatorio + extensión validada (nunca se
 *      usa el nombre original del usuario para construir rutas → evita path
 *      traversal).
 *    - Lista blanca de tipos MIME y de extensiones.
 *    - Límite de tamaño por archivo (env.MAX_UPLOAD_MB).
 * ============================================================================
 */

// Carpeta absoluta donde viven los archivos.
export const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);

// Aseguramos que la carpeta exista al arrancar.
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// Lista blanca: tipo MIME -> extensión canónica.
const ALLOWED: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'text/plain': '.txt',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const ext = ALLOWED[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (!ALLOWED[file.mimetype]) {
    cb(HttpError.badRequest(`Tipo de archivo no permitido: ${file.mimetype}`));
    return;
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 10,
  },
});

/**
 * Devuelve la ruta absoluta y validada de un archivo almacenado.
 * Garantiza que el resultado quede DENTRO de UPLOAD_ROOT (anti path traversal).
 */
export function resolveStoredPath(nombreAlmacenado: string): string {
  const abs = path.resolve(UPLOAD_ROOT, nombreAlmacenado);
  if (abs !== path.join(UPLOAD_ROOT, path.basename(nombreAlmacenado))) {
    throw HttpError.badRequest('Ruta de archivo inválida');
  }
  return abs;
}

/** Borra un archivo del disco si existe (no falla si ya no está). */
export function deleteStoredFile(nombreAlmacenado: string): void {
  try {
    fs.unlinkSync(resolveStoredPath(nombreAlmacenado));
  } catch {
    /* archivo ya inexistente: lo ignoramos */
  }
}
