import { Prisma, RolUsuario, EstadoCursada } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { hashPassword } from '../../utils/password';
import { generarLegajo } from '../../utils/legajo';
import { CreateAlumnoInput, ListAlumnosQuery, UpdateAlumnoInput, UpdateMyContactInput } from './alumnos.schemas';

const alumnoInclude = {
  usuario: {
    select: { id: true, email: true, rol: true, activo: true, ultimoLogin: true },
  },
} satisfies Prisma.AlumnoInclude;

export const alumnosService = {
  async create(data: CreateAlumnoInput) {
    // Verificamos unicidad antes de la transacción
    const conflict = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (conflict) throw HttpError.conflict('Ya existe un usuario con ese email');

    const passwordHash = await hashPassword(data.password);

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
        include: alumnoInclude,
      });
    });

    return alumno;
  },

  async list(query: ListAlumnosQuery) {
    const where: Prisma.AlumnoWhereInput = {};
    if (query.estado) where.estado = query.estado;
    if (query.carrera) where.carrera = { equals: query.carrera, mode: 'insensitive' };
    if (query.q) {
      where.OR = [
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { apellido: { contains: query.q, mode: 'insensitive' } },
        { legajo: { contains: query.q, mode: 'insensitive' } },
        { dni: { contains: query.q } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.alumno.count({ where }),
      prisma.alumno.findMany({
        where,
        include: alumnoInclude,
        orderBy: { apellido: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return { total, page: query.page, pageSize: query.pageSize, items };
  },

  async getById(id: string) {
    const alumno = await prisma.alumno.findUnique({
      where: { id },
      include: alumnoInclude,
    });
    if (!alumno) throw HttpError.notFound('Alumno no encontrado');
    return alumno;
  },

  async getByUsuarioId(usuarioId: string) {
    const alumno = await prisma.alumno.findUnique({
      where: { usuarioId },
      include: alumnoInclude,
    });
    if (!alumno) throw HttpError.notFound('Alumno no encontrado');
    return alumno;
  },

  async update(id: string, data: UpdateAlumnoInput) {
    return prisma.alumno.update({
      where: { id },
      data,
      include: alumnoInclude,
    });
  },

  /** El alumno actualiza sus propios datos de contacto (telefono / dirección). */
  async updateMyContact(usuarioId: string, data: UpdateMyContactInput) {
    const alumno = await prisma.alumno.findUnique({ where: { usuarioId } });
    if (!alumno) throw HttpError.notFound('Alumno no encontrado');
    return prisma.alumno.update({
      where: { id: alumno.id },
      data,
      include: alumnoInclude,
    });
  },

  // Devuelve el legajo del alumno: datos + historial + estadisticas.
  async getLegajo(alumnoId: string) {
    const alumno = await prisma.alumno.findUnique({
      where: { id: alumnoId },
      include: {
        inscripciones: {
          include: {
            materia: {
              select: { id: true, codigo: true, nombre: true, anio: true, cuatrimestre: true },
            },
          },
          orderBy: [{ cicloLectivo: 'desc' }, { fechaInscripcion: 'desc' }],
        },
      },
    });
    if (!alumno) throw HttpError.notFound('Alumno no encontrado');

    const totalMaterias = alumno.inscripciones.length;
    const aprobadas = alumno.inscripciones.filter(
      (i) => i.estadoCursada === EstadoCursada.APROBADA,
    ).length;
    const regulares = alumno.inscripciones.filter(
      (i) => i.estadoCursada === EstadoCursada.REGULAR,
    ).length;

    return {
      alumno: {
        id: alumno.id,
        legajo: alumno.legajo,
        dni: alumno.dni,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        carrera: alumno.carrera,
        anioIngreso: alumno.anioIngreso,
        estado: alumno.estado,
      },
      estadisticas: { totalMaterias, aprobadas, regulares },
      historial: alumno.inscripciones,
    };
  },
};
