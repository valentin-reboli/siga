import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Genera una contraseña temporal siguiendo el estándar institucional:
 * [inicial_nombre][apellido_sin_espacios][4 dígitos aleatorios]
 * Ejemplo: Juan Pérez → jperez4821
 */
export function generatePassword(nombre: string, apellido: string): string {
  const inicial = nombre.trim().toLowerCase().charAt(0);
  const ape = apellido.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/\s+/g, '');
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  return `${inicial}${ape}${digits}`;
}
