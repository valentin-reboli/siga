import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // Carpeta donde se guardan los archivos subidos al foro.
  // En local: ./uploads. En Railway: montar un Volume y apuntar acá
  // (ej. UPLOAD_DIR=/data/uploads).
  UPLOAD_DIR: z.string().default('./uploads'),
  // Tamaño máximo por archivo, en MB.
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(200).default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Error en variables de entorno:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida');
}

export const env = parsed.data;
