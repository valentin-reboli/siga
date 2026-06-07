import {
  Prisma,
  EstadoAlumno,
  EstadoCursada,
  EstadoInscripcion,
  TipoInscripcion,
} from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { claveMateriaCoincide } from '../../utils/claveMateria';
import {
  CreateInscripcionInput,
  ListInscripcionesQuery,
  UpdateInscripcionInput,
} from './inscripciones.schemas';

const inscripcionInclude = {
  alumno: { select: { id: true, legajo: true, nombre: true, apellido: true } },
  materia: { select: { id: true, codigo: true, nombre: true, cupoMaximo: true } },
  notasParciales: { orderBy: [{ numero: 'asc' as const }, { tipo: 'asc' as const }] },
} satisfies Prisma.InscripcionInclude;

// Chequea correlatividades.
// REGULAR  -> la materia anterior tiene que estar regular o aprobada.
// APROBADA -> la materia anterior tiene que estar aprobada (final).
async function validarCorrelatividades(alumnoId: string, materiaId: string) {
  const correlativas = await prisma.correlatividad.findMany({
    where: { materiaId },
    include: { requiere: { select: { id: true, codigo: true, nombre: true } } },
  });

  if (correlativas.length === 0) return;

  // Traemos todas las inscripciones del alumno a las materias requeridas
  const requeridas = correlativas.map((c) => c.requiereId);
  const historial = await prisma.inscripcion.findMany({
    where: {
      alumnoId,
      materiaId: { in: requeridas },
    },
    select: { materiaId: true, estadoCursada: true },
  });

  // Para cada correlatividad, buscamos el mejor estado registrado
  const faltantes: { codigo: string; nombre: string; tipoRequerido: string }[] = [];
  for (const corr of correlativas) {
    const intentos = historial.filter((h) => h.materiaId === corr.requiereId);
    const tieneAprobada = intentos.some((i) => i.estadoCursada === EstadoCursada.APROBADA);
    const tieneRegular = intentos.some((i) => i.estadoCursada === EstadoCursada.REGULAR);

    if (corr.tipo === 'APROBADA' && !tieneAprobada) {
      faltantes.push({
        codigo: corr.requiere.codigo,
        nombre: corr.requiere.nombre,
        tipoRequerido: 'APROBADA',
      });
    } else if (corr.tipo === 'REGULAR' && !tieneAprobada && !tieneRegular) {
      faltantes.push({
        codigo: corr.requiere.codigo,
        nombre: corr.requiere.nombre,
        tipoRequerido: 'REGULAR',
      });
    }
  }

  if (faltantes.length > 0) {
    throw HttpError.unprocessable(
      'No se cumplen las correlatividades requeridas',
      { faltantes },
    );
  }
}

// Chequea que haya cupo disponible para la cursada.
async function validarCupo(materiaId: string, cicloLectivo: number) {
  const materia = await prisma.materia.findUnique({
    where: { id: materiaId },
    select: { cupoMaximo: true, activa: true, nombre: true },
  });
  if (!materia) throw HttpError.notFound('Materia no encontrada');
  if (!materia.activa) throw HttpError.badRequest('La materia no está activa');

  const inscriptos = await prisma.inscripcion.count({
    where: {
      materiaId,
      cicloLectivo,
      tipo: TipoInscripcion.CURSADA,
      estado: { in: [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA] },
    },
  });

  if (inscriptos >= materia.cupoMaximo) {
    throw HttpError.conflict(
      `Cupo completo para "${materia.nombre}" en el ciclo ${cicloLectivo} (${inscriptos}/${materia.cupoMaximo})`,
    );
  }
}

export const inscripcionesService = {
  async create(data: CreateInscripcionInput, opts: { validarClave?: boolean } = {}) {
    // 1. Alumno debe estar activo
    const alumno = await prisma.alumno.findUnique({
      where: { id: data.alumnoId },
      select: { estado: true },
    });
    if (!alumno) throw HttpError.notFound('Alumno no encontrado');
    if (alumno.estado !== EstadoAlumno.ACTIVO) {
      throw HttpError.badRequest(`El alumno no se encuentra en estado ACTIVO (actual: ${alumno.estado})`);
    }

    // 1.b Validar la clave de la materia (sólo cuando se inscribe el propio alumno
    //     a una CURSADA). El staff puede inscribir sin clave.
    if (opts.validarClave && data.tipo === TipoInscripcion.CURSADA) {
      const materia = await prisma.materia.findUnique({
        where: { id: data.materiaId },
        select: { nombre: true, claveInscripcion: true },
      });
      if (!materia) throw HttpError.notFound('Materia no encontrada');
      if (!claveMateriaCoincide(data.clave, materia.nombre, materia.claveInscripcion)) {
        throw HttpError.forbidden(
          'La clave de la materia es incorrecta. Pedísela al docente de la cátedra.',
        );
      }
    }

    // 2. Validar correlatividades
    await validarCorrelatividades(data.alumnoId, data.materiaId);

    // 3. Validar cupo si es cursada
    if (data.tipo === TipoInscripcion.CURSADA) {
      await validarCupo(data.materiaId, data.cicloLectivo);
    }

    // 4. Validar que no exista una inscripción duplicada (uniqueness del schema atrapa esto,
    //    pero lo chequeamos antes para devolver un mensaje útil)
    const existente = await prisma.inscripcion.findUnique({
      where: {
        alumnoId_materiaId_tipo_cicloLectivo: {
          alumnoId: data.alumnoId,
          materiaId: data.materiaId,
          tipo: data.tipo,
          cicloLectivo: data.cicloLectivo,
        },
      },
    });
    if (existente) {
      throw HttpError.conflict('Ya existe una inscripción para este alumno, materia, tipo y ciclo');
    }

    return prisma.inscripcion.create({
      data: {
        alumnoId: data.alumnoId,
        materiaId: data.materiaId,
        tipo: data.tipo,
        cicloLectivo: data.cicloLectivo,
        fechaExamen: data.fechaExamen,
        estado: EstadoInscripcion.CONFIRMADA,
        estadoCursada: data.tipo === TipoInscripcion.CURSADA ? EstadoCursada.EN_CURSO : null,
      },
      include: inscripcionInclude,
    });
  },

  async list(query: ListInscripcionesQuery & { materiaIds?: string[] }) {
    const where: Prisma.InscripcionWhereInput = {};
    if (query.alumnoId) where.alumnoId = query.alumnoId;
    if (query.materiaIds && query.materiaIds.length > 0) {
      where.materiaId = { in: query.materiaIds };
    } else if (query.materiaId) {
      where.materiaId = query.materiaId;
    }
    if (query.tipo) where.tipo = query.tipo;
    if (query.estado) where.estado = query.estado;
    if (query.cicloLectivo) where.cicloLectivo = query.cicloLectivo;

    const [total, items] = await Promise.all([
      prisma.inscripcion.count({ where }),
      prisma.inscripcion.findMany({
        where,
        include: inscripcionInclude,
        orderBy: { fechaInscripcion: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return { total, page: query.page, pageSize: query.pageSize, items };
  },

  async update(id: string, data: UpdateInscripcionInput) {
    return prisma.inscripcion.update({
      where: { id },
      data,
      include: inscripcionInclude,
    });
  },

  async cancel(id: string) {
    return prisma.inscripcion.update({
      where: { id },
      data: { estado: EstadoInscripcion.CANCELADA },
      include: inscripcionInclude,
    });
  },
};
