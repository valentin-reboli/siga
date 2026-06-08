import {
  EstadoAsistencia,
  EstadoInscripcion,
  RolUsuario,
  TipoInscripcion,
} from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { GuardarAsistenciaInput } from './asistencias.schemas';

// Convierte 'YYYY-MM-DD' a un Date en medianoche UTC, así la columna @db.Date
// guarda siempre el día correcto sin corrimientos de zona horaria.
function normalizeFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

// Solo se toma asistencia sobre inscripciones de CURSADA vigentes.
const ESTADOS_VIGENTES = [EstadoInscripcion.PENDIENTE, EstadoInscripcion.CONFIRMADA];

const alumnoSelect = {
  select: { id: true, legajo: true, nombre: true, apellido: true },
} as const;

const rosterOrderBy = [
  { alumno: { apellido: 'asc' as const } },
  { alumno: { nombre: 'asc' as const } },
];

export const asistenciasService = {
  /**
   * Verifica que el usuario pueda gestionar la asistencia de esta materia.
   * - SUPERADMIN / ADMINISTRACION: cualquier materia.
   * - DOCENTE: solo materias que tenga asignadas (DocenteMateria).
   */
  async assertAccesoMateria(materiaId: string, usuarioId: string, rol: RolUsuario): Promise<void> {
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
      select: { id: true },
    });
    if (!materia) throw HttpError.notFound('Materia no encontrada');

    if (rol === RolUsuario.DOCENTE) {
      const asignacion = await prisma.docenteMateria.findFirst({
        where: { usuarioId, materiaId },
        select: { id: true },
      });
      if (!asignacion) throw HttpError.forbidden('No tenés acceso a esta materia');
    }
  },

  /**
   * Devuelve el listado de alumnos en cursada de la materia/ciclo. Si se pasa
   * `fecha`, incluye el estado de asistencia ya cargado para ese día (o null).
   */
  async roster(materiaId: string, cicloLectivo: number, fecha?: string) {
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        materiaId,
        cicloLectivo,
        tipo: TipoInscripcion.CURSADA,
        estado: { in: ESTADOS_VIGENTES },
      },
      select: { id: true, alumno: alumnoSelect },
      orderBy: rosterOrderBy,
    });

    let estados = new Map<string, EstadoAsistencia>();
    if (fecha && inscripciones.length > 0) {
      const registros = await prisma.asistencia.findMany({
        where: {
          fecha: normalizeFecha(fecha),
          inscripcionId: { in: inscripciones.map((i) => i.id) },
        },
        select: { inscripcionId: true, estado: true },
      });
      estados = new Map(registros.map((r) => [r.inscripcionId, r.estado]));
    }

    return {
      materiaId,
      cicloLectivo,
      fecha: fecha ?? null,
      items: inscripciones.map((i) => ({
        inscripcionId: i.id,
        alumno: i.alumno,
        estado: estados.get(i.id) ?? null,
      })),
    };
  },

  /**
   * Guarda (upsert) la asistencia de una fecha para varios alumnos de una vez.
   * Filtra cualquier inscripción que no pertenezca a la materia/ciclo para
   * evitar que se inyecten ids ajenos.
   */
  async guardar(materiaId: string, data: GuardarAsistenciaInput) {
    const dia = normalizeFecha(data.fecha);

    const validas = await prisma.inscripcion.findMany({
      where: {
        materiaId,
        cicloLectivo: data.cicloLectivo,
        tipo: TipoInscripcion.CURSADA,
        id: { in: data.registros.map((r) => r.inscripcionId) },
      },
      select: { id: true },
    });
    const validSet = new Set(validas.map((v) => v.id));
    const registros = data.registros.filter((r) => validSet.has(r.inscripcionId));

    if (registros.length === 0) {
      throw HttpError.badRequest('Ninguno de los alumnos pertenece a esta materia/ciclo');
    }

    await prisma.$transaction(
      registros.map((r) =>
        prisma.asistencia.upsert({
          where: { inscripcionId_fecha: { inscripcionId: r.inscripcionId, fecha: dia } },
          update: { estado: r.estado },
          create: { inscripcionId: r.inscripcionId, fecha: dia, estado: r.estado },
        }),
      ),
    );

    return { guardados: registros.length, fecha: data.fecha };
  },

  /**
   * Resumen por alumno: presentes / ausentes / justificadas y % de asistencia
   * (presentes sobre clases computables; las justificadas no cuentan en contra).
   */
  async resumen(materiaId: string, cicloLectivo: number) {
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        materiaId,
        cicloLectivo,
        tipo: TipoInscripcion.CURSADA,
        estado: { in: ESTADOS_VIGENTES },
      },
      select: {
        id: true,
        alumno: alumnoSelect,
        asistencias: { select: { estado: true } },
      },
      orderBy: rosterOrderBy,
    });

    // Total de clases tomadas (fechas distintas) en la materia/ciclo.
    const fechas = await prisma.asistencia.findMany({
      where: { inscripcion: { materiaId, cicloLectivo } },
      select: { fecha: true },
      distinct: ['fecha'],
    });

    const items = inscripciones.map((i) => {
      const presentes = i.asistencias.filter((a) => a.estado === EstadoAsistencia.PRESENTE).length;
      const ausentes = i.asistencias.filter((a) => a.estado === EstadoAsistencia.AUSENTE).length;
      const justificadas = i.asistencias.filter(
        (a) => a.estado === EstadoAsistencia.JUSTIFICADO,
      ).length;
      const computables = presentes + ausentes;
      const porcentaje = computables > 0 ? Math.round((presentes / computables) * 100) : null;
      return { inscripcionId: i.id, alumno: i.alumno, presentes, ausentes, justificadas, porcentaje };
    });

    return { materiaId, cicloLectivo, totalClases: fechas.length, items };
  },

  /** Fechas (YYYY-MM-DD) en las que ya se tomó asistencia, más recientes primero. */
  async clases(materiaId: string, cicloLectivo: number) {
    const fechas = await prisma.asistencia.findMany({
      where: { inscripcion: { materiaId, cicloLectivo } },
      select: { fecha: true },
      distinct: ['fecha'],
      orderBy: { fecha: 'desc' },
    });
    return fechas.map((f) => f.fecha.toISOString().slice(0, 10));
  },
};
