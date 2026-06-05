import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import {
  CorrelatividadInput,
  CreateMateriaInput,
  ListMateriasQuery,
  UpdateMateriaInput,
} from './materias.schemas';

const materiaInclude = {
  correlativasRequeridas: {
    include: {
      requiere: { select: { id: true, codigo: true, nombre: true } },
    },
  },
} satisfies Prisma.MateriaInclude;

// Quita la clave de inscripción antes de devolver la materia: es secreta y no
// debe viajar nunca al cliente.
function sinClave<T extends { claveInscripcion?: string | null }>(materia: T): Omit<T, 'claveInscripcion'> {
  const { claveInscripcion: _omitida, ...resto } = materia;
  void _omitida;
  return resto;
}

export const materiasService = {
  async create(data: CreateMateriaInput) {
    const materia = await prisma.materia.create({ data, include: materiaInclude });
    return sinClave(materia);
  },

  async list(query: ListMateriasQuery) {
    const where: Prisma.MateriaWhereInput = {};
    if (query.carrera) where.carrera = { equals: query.carrera, mode: 'insensitive' };
    if (query.anio !== undefined) where.anio = query.anio;
    if (query.activa !== undefined) where.activa = query.activa;
    if (query.q) {
      where.OR = [
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { codigo: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.materia.count({ where }),
      prisma.materia.findMany({
        where,
        include: materiaInclude,
        orderBy: [{ anio: 'asc' }, { cuatrimestre: 'asc' }, { nombre: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return { total, page: query.page, pageSize: query.pageSize, items: items.map(sinClave) };
  },

  async getById(id: string) {
    const materia = await prisma.materia.findUnique({ where: { id }, include: materiaInclude });
    if (!materia) throw HttpError.notFound('Materia no encontrada');
    return sinClave(materia);
  },

  async update(id: string, data: UpdateMateriaInput) {
    const materia = await prisma.materia.update({ where: { id }, data, include: materiaInclude });
    return sinClave(materia);
  },

  async addCorrelatividad(materiaId: string, data: CorrelatividadInput) {
    if (materiaId === data.requiereId) {
      throw HttpError.badRequest('Una materia no puede ser correlativa de sí misma');
    }
    // Validar existencia
    const [m1, m2] = await Promise.all([
      prisma.materia.findUnique({ where: { id: materiaId } }),
      prisma.materia.findUnique({ where: { id: data.requiereId } }),
    ]);
    if (!m1 || !m2) throw HttpError.notFound('Alguna de las materias no existe');

    return prisma.correlatividad.create({
      data: {
        materiaId,
        requiereId: data.requiereId,
        tipo: data.tipo,
      },
      include: {
        requiere: { select: { id: true, codigo: true, nombre: true } },
      },
    });
  },

  async removeCorrelatividad(correlatividadId: string) {
    return prisma.correlatividad.delete({ where: { id: correlatividadId } });
  },
};
