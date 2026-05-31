import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { signToken } from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/password';
import { LoginInput, RegisterInput } from './auth.schemas';
import { RolUsuario } from '@prisma/client';

export const authService = {
  async register(data: RegisterInput) {
    const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existing) {
      throw HttpError.conflict('Ya existe un usuario con ese email');
    }

    const passwordHash = await hashPassword(data.password);
    const usuario = await prisma.usuario.create({
      data: {
        email: data.email,
        passwordHash,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol ?? RolUsuario.ALUMNO,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        creadoEn: true,
      },
    });
    return usuario;
  },

  async login(data: LoginInput) {
    const usuario = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (!usuario || !usuario.activo) {
      throw HttpError.unauthorized('Credenciales inválidas');
    }

    const ok = await comparePassword(data.password, usuario.passwordHash);
    if (!ok) {
      throw HttpError.unauthorized('Credenciales inválidas');
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const token = signToken({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
    };
  },

  async me(userId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        ultimoLogin: true,
        alumno: {
          select: {
            id: true,
            legajo: true,
            carrera: true,
            estado: true,
          },
        },
      },
    });
    if (!usuario) {
      throw HttpError.notFound('Usuario no encontrado');
    }
    return usuario;
  },
};
