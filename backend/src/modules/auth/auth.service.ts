import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { signToken } from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/password';
import { ChangePasswordInput, LoginInput, RegisterInput } from './auth.schemas';
import { RolUsuario } from '@prisma/client';

export const authService = {
  async register(data: RegisterInput) {
    // El rol ALUMNO requiere crear también su perfil en la tabla `alumnos`.
    // Para no generar usuarios huérfanos, el alta de alumnos va por
    // /api/usuarios/alumnos. Este endpoint solo crea cuentas de staff.
    if (data.rol === RolUsuario.ALUMNO) {
      throw HttpError.badRequest(
        'Para crear un alumno usá /api/usuarios/alumnos (crea usuario + legajo).',
      );
    }

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
        rol: data.rol ?? RolUsuario.DOCENTE,
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

  async changePassword(userId: string, data: ChangePasswordInput) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) throw HttpError.notFound('Usuario no encontrado');

    const ok = await comparePassword(data.claveActual, usuario.passwordHash);
    if (!ok) throw HttpError.badRequest('La contraseña actual es incorrecta');

    const nuevoHash = await hashPassword(data.claveNueva);
    await prisma.usuario.update({
      where: { id: userId },
      data: { passwordHash: nuevoHash },
    });
    return { ok: true };
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
        avatarUrl: true,
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
