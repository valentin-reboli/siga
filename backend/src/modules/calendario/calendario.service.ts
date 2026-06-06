import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { JwtPayload } from '../../utils/jwt';
import { foroService } from '../foro/foro.service';

export type TipoEvento = 'EXAMEN' | 'MESA';

export interface EventoCalendario {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  fecha: string; // ISO
  materia: { id: string; codigo: string; nombre: string } | null;
  detalle?: string;
}

export const calendarioService = {
  /**
   * Eventos del calendario para el usuario, dentro de un rango opcional:
   *   - EXAMEN: publicaciones de tipo EXAMEN del foro de sus materias.
   *   - MESA:   mesas de examen (inscripciones MESA_EXAMEN con fecha).
   *
   * El alcance depende del rol (alumno → lo suyo, docente → sus materias,
   * staff → todo), reutilizando la lógica de materias accesibles del foro.
   */
  async eventos(user: JwtPayload, desde?: Date, hasta?: Date): Promise<EventoCalendario[]> {
    const materiaIds = await foroService.materiasAccesibles(user);

    // Filtro de fecha reutilizable. Si no hay rango, sólo excluye nulos.
    const fechaFilter: Prisma.DateTimeNullableFilter = {};
    if (desde) fechaFilter.gte = desde;
    if (hasta) fechaFilter.lte = hasta;
    if (!desde && !hasta) fechaFilter.not = null;

    const eventos: EventoCalendario[] = [];

    // ── Exámenes del foro ────────────────────────────────────────────────
    if (materiaIds.length > 0) {
      const examenes = await prisma.publicacion.findMany({
        where: { materiaId: { in: materiaIds }, tipo: 'EXAMEN', fechaExamen: fechaFilter },
        select: {
          id: true,
          titulo: true,
          fechaExamen: true,
          materia: { select: { id: true, codigo: true, nombre: true } },
        },
        orderBy: { fechaExamen: 'asc' },
      });
      for (const e of examenes) {
        if (!e.fechaExamen) continue;
        eventos.push({
          id: `examen-${e.id}`,
          tipo: 'EXAMEN',
          titulo: e.titulo,
          fecha: e.fechaExamen.toISOString(),
          materia: e.materia,
          detalle: 'Examen / parcial',
        });
      }
    }

    // ── Mesas de examen ──────────────────────────────────────────────────
    const whereMesa: Prisma.InscripcionWhereInput = {
      tipo: 'MESA_EXAMEN',
      fechaExamen: fechaFilter,
    };

    if (user.rol === 'ALUMNO') {
      const alumno = await prisma.alumno.findUnique({
        where: { usuarioId: user.sub },
        select: { id: true },
      });
      if (!alumno) return ordenar(eventos);
      whereMesa.alumnoId = alumno.id;
    } else if (user.rol === 'DOCENTE') {
      if (materiaIds.length === 0) return ordenar(eventos);
      whereMesa.materiaId = { in: materiaIds };
    }
    // SUPERADMIN / ADMINISTRACION: ven todas las mesas.

    const mesas = await prisma.inscripcion.findMany({
      where: whereMesa,
      select: {
        id: true,
        fechaExamen: true,
        materia: { select: { id: true, codigo: true, nombre: true } },
        alumno: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaExamen: 'asc' },
    });
    for (const m of mesas) {
      if (!m.fechaExamen) continue;
      eventos.push({
        id: `mesa-${m.id}`,
        tipo: 'MESA',
        titulo: `Mesa · ${m.materia?.nombre ?? 'Examen final'}`,
        fecha: m.fechaExamen.toISOString(),
        materia: m.materia,
        detalle:
          user.rol === 'ALUMNO'
            ? 'Mesa de examen final'
            : `Mesa de examen · ${m.alumno?.apellido ?? ''}, ${m.alumno?.nombre ?? ''}`.trim(),
      });
    }

    return ordenar(eventos);
  },
};

function ordenar(eventos: EventoCalendario[]): EventoCalendario[] {
  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
