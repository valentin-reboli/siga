import { z } from 'zod';
import { RolUsuario } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  rol: z.nativeEnum(RolUsuario).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z.object({
  claveActual: z.string().min(1, 'Ingresá tu contraseña actual'),
  claveNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
