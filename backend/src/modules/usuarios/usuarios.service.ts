import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { ListUsuariosQuery, UpdateUsuarioInput } from './usuarios.schemas';

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
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: usuarioSelect,
    });
    if (!usuario) throw HttpError.notFound('Usuario no encontrado');
    return usuario;
  },

  async update(id: string, data: UpdateUsuarioInput) {
    return prisma.usuario.update({
      where: { id },
      data,
      select: usuarioSelect,
    });
  },

  async deactivate(id: string) {
    return prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: usuarioSelect,
    });
  },
};
