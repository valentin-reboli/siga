import { Prisma, RolUsuario } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { hashPassword, generatePassword } from '../../utils/password';
import { generarLegajo } from '../../utils/legajo';
import { ListUsuariosQuery, UpdateUsuarioInput, CreateAlumnoInput, CreateStaffInput } from './usuarios.schemas';

/** Quita tildes/diacríticos, pasa a minúsculas y deja solo a-z. */
function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

/**
 * Partículas de nombres que se omiten al elegir la palabra principal.
 * Cubre apellidos compuestos españoles y algunos europeos comunes.
 */
const NAME_PARTICLES = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'van', 'von', 'y', 'e', 'bin', 'bint',
]);

/**
 * Extrae la palabra más representativa de un fragmento de nombre:
 *  - omite partículas (de, del, la, los...)
 *  - normaliza a a-z
 *  - trunca a maxLen caracteres para mantener emails legibles
 */
function extractEmailPart(namePart: string, maxLen = 12): string {
  const words = namePart.trim().split(/\s+/);
  for (const word of words) {
    const normalized = normalizeStr(word);
    if (normalized.length >= 2 && !NAME_PARTICLES.has(word.toLowerCase())) {
      return normalized.slice(0, maxLen);
    }
  }
  const full = normalizeStr(words.join(''));
  return full.slice(0, maxLen) || 'usuario';
}

/**
 * Genera un email institucional único: nombre.apellidoNNN@iscr.edu.ar
 *
 * Reintenta hasta 10 veces con distintos sufijos aleatorios (100-999);
 * si todos colisionan usa un sufijo de timestamp como último recurso.
 */
async function generateInstitutionalEmail(nombre: string, apellido: string): Promise<string> {
  const n = extractEmailPart(nombre);
  const a = extractEmailPart(apellido);
  for (let attempt = 0; attempt < 10; attempt++) {
    const rand = Math.floor(100 + Math.random() * 900);
    const email = `${n}.${a}${rand}@iscr.edu.ar`;
    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (!exists) return email;
  }
  const ts = Date.now().toString().slice(-6);
  return `${n}.${a}${ts}@iscr.edu.ar`;
}

const usuarioSelect = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  rol: true,
  activo: true,
  ultimoLogin: true,
  creadoEn: true,
  avatarUrl: true,
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

  async reactivate(id: string) {
    return prisma.usuario.update({ where: { id }, data: { activo: true }, select: usuarioSelect });
  },

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

  async updateAvatar(id: string, avatar: string) {
    return prisma.usuario.update({
      where: { id },
      data: { avatarUrl: avatar },
      select: { id: true, avatarUrl: true },
    });
  },

  async removeAvatar(id: string) {
    return prisma.usuario.update({
      where: { id },
      data: { avatarUrl: null },
      select: { id: true, avatarUrl: true },
    });
  },

  async createAlumno(data: CreateAlumnoInput) {
    const existeDni = await prisma.alumno.findUnique({ where: { dni: data.dni } });
    if (existeDni) throw HttpError.conflict('Ya existe un alumno con ese DNI');

    const email = await generateInstitutionalEmail(data.nombre, data.apellido);
    const passwordPlain = generatePassword(data.nombre, data.apellido);
    const passwordHash = await hashPassword(passwordPlain);

    const alumno = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
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

  async createStaff(data: CreateStaffInput) {
    const email = await generateInstitutionalEmail(data.nombre, data.apellido);
    const passwordPlain = generatePassword(data.nombre, data.apellido);
    const passwordHash = await hashPassword(passwordPlain);

    const usuario = await prisma.usuario.create({
      data: { email, passwordHash, nombre: data.nombre, apellido: data.apellido, rol: data.rol },
      select: usuarioSelect,
    });

    return { usuario, passwordTemporal: passwordPlain };
  },

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
