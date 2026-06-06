import { Prisma, RolUsuario } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { hashPassword, generatePassword } from '../../utils/password';
import { generarLegajo } from '../../utils/legajo';
import { ListUsuariosQuery, UpdateUsuarioInput, CreateAlumnoInput, CreateStaffInput } from './usuarios.schemas';

const usuarioSelect = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  rol: true,
  activo: true,
  ultimoLogin: true,
  creadoEn: true,
} satisfies Prisma.UsuarioSelect;

export const usuariosService = {
  async list(query: ListUsuariosQuery) {
    const where: Prisma.UsuarioWhereInput = {};
    if (query.rol) where.rol = query.rol;
    if (query.activo !== undefined) where.activo = query.activo;
    if (query.q) {
      where.OR = [
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { apellido: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        select: usuarioSelect,
        orderBy: { creadoEn: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return { total, page: query.page, pageSize: query.pageSize, items };
  },

  async getById(id: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id }, select: usuarioSelect });
    if (!usuario) throw HttpError.notFound('Usuario no encontrado');
    return usuario;
  },

  async update(id: string, data: UpdateUsuarioInput) {
    return prisma.usuario.update({ where: { id }, data, select: usuarioSelect });
  },

  async deactivate(id: string) {
    return prisma.usuario.update({ where: { id }, data: { activo: false }, select: usuarioSelect });
  },

  /** Reactiva un usuario suspendido. */
  async reactivate(id: string) {
    return prisma.usuario.update({ where: { id }, data: { activo: true }, select: usuarioSelect });
  },

  /** Restablece la contraseña: genera una nueva temporal y devuelve el texto plano. */
  async resetPassword(id: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { nombre: true, apellido: true },
    });
    if (!usuario) throw HttpError.notFound('Usuario no encontrado');
    const passwordPlain = generatePassword(usuario.nombre, usuario.apellido);
    const passwordHash = await hashPassword(passwordPlain);
    await prisma.usuario.update({ where: { id }, data: { passwordHash } });
    return { passwordTemporal: passwordPlain };
  },

  /** Actualiza la foto de perfil del propio usuario (data URL). */
  async updateAvatar(id: string, avatar: string) {
    return prisma.usuario.update({
      where: { id },
      data: { avatarUrl: avatar },
      select: { id: true, avatarUrl: true },
    });
  },

  /** Quita la foto de perfil. */
  async removeAvatar(id: string) {
    return prisma.usuario.update({
      where: { id },
      data: { avatarUrl: null },
      select: { id: true, avatarUrl: true },
    });
  },

  /**
   * Crea un usuario ALUMNO + su perfil en la tabla alumnos.
   * Devuelve el usuario, el alumno y la contraseña generada (mostrar una sola vez al admin).
   */
  async createAlumno(data: CreateAlumnoInput) {
    const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existe) throw HttpError.conflict('Ya existe un usuario con ese email');

    const existeDni = await prisma.alumno.findUnique({ where: { dni: data.dni } });
    if (existeDni) throw HttpError.conflict('Ya existe un alumno con ese DNI');

    const passwordPlain = generatePassword(data.nombre, data.apellido);
    const passwordHash = await hashPassword(passwordPlain);

    const alumno = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email: data.email,
          passwordHash,
          nombre: data.nombre,
          apellido: data.apellido,
          rol: RolUsuario.ALUMNO,
        },
      });
      const legajo = await generarLegajo(tx, data.anioIngreso);
      return tx.alumno.create({
        data: {
          legajo,
          dni: data.dni,
          nombre: data.nombre,
          apellido: data.apellido,
          fechaNacimiento: data.fechaNacimiento,
          telefono: data.telefono,
          direccion: data.direccion,
          carrera: data.carrera,
          anioIngreso: data.anioIngreso,
          usuarioId: usuario.id,
        },
        include: { usuario: { select: usuarioSelect } },
      });
    });

    return { alumno, passwordTemporal: passwordPlain };
  },

  /**
   * Crea un usuario de staff (DOCENTE o ADMINISTRACION).
   * Devuelve el usuario y la contraseña generada.
   */
  async createStaff(data: CreateStaffInput) {
    const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existe) throw HttpError.conflict('Ya existe un usuario con ese email');

    const passwordPlain = generatePassword(data.nombre, data.apellido);
    const passwordHash = await hashPassword(passwordPlain);

    const usuario = await prisma.usuario.create({
      data: { email: data.email, passwordHash, nombre: data.nombre, apellido: data.apellido, rol: data.rol },
      select: usuarioSelect,
    });

    return { usuario, passwordTemporal: passwordPlain };
  },

  // Asignar/remover materia a un docente
  async assignMateria(docenteId: string, materiaId: string, cicloLectivo = 0) {
    const docente = await prisma.usuario.findUnique({ where: { id: docenteId } });
    if (!docente || docente.rol !== RolUsuario.DOCENTE) {
      throw HttpError.badRequest('El usuario no es docente');
    }
    return prisma.docenteMateria.upsert({
      where: { usuarioId_materiaId_cicloLectivo: { usuarioId: docenteId, materiaId, cicloLectivo } },
      update: {},
      create: { usuarioId: docenteId, materiaId, cicloLectivo },
    });
  },

  async removeMateria(docenteId: string, materiaId: string, cicloLectivo = 0) {
    return prisma.docenteMateria.delete({
      where: { usuarioId_materiaId_cicloLectivo: { usuarioId: docenteId, materiaId, cicloLectivo } },
    });
  },

  async getMaterias(docenteId: string) {
    return prisma.docenteMateria.findMany({
      where: { usuarioId: docenteId },
      include: { materia: true },
    });
  },
};
