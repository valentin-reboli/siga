import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { env } from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}


export function generatePassword(nombre: string, apellido: string): string {
  const inicial = nombre.trim().toLowerCase().charAt(0);
  const ape = apellido.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/\s+/g, '');
  const digits = randomInt(1000, 10000).toString(); // 4 dígitos criptográficamente seguros
  return `${inicial}${ape}${digits}`;
}
