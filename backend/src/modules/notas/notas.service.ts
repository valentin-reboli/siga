import { RolUsuario } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { UpsertParcialInput } from './notas.schemas';

export const notasService = {
  /** Verifica que el usuario tenga acceso a calificar esta inscripción. */
  async verificarAcceso(inscripcionId: string, usuarioId: string, rol: RolUsuario) {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: inscripcionId },
      select: { id: true, materiaId: true, tipo: true },
    });
    if (!inscripcion) throw HttpError.notFound('Inscripción no encontrada');

    if (rol === RolUsuario.DOCENTE) {
      const asignacion = await prisma.docenteMateria.findFirst({
        where: { usuarioId, materiaId: inscripcion.materiaId },
      });
      if (!asignacion) throw HttpError.forbidden('No tenés acceso a esta materia');
    }
    return inscripcion;
  },

  /** Crea o actualiza una nota parcial (upsert por inscripcionId + numero + tipo). */
  async upsert(inscripcionId: string, numero: number, data: UpsertParcialInput) {
    return prisma.notaParcial.upsert({
      where: {
        inscripcionId_numero_tipo: {
          inscripcionId,
          numero,
          tipo: data.tipo,
        },
      },
      update: {
        nota: data.nota,
        observaciones: data.observaciones ?? null,
      },
      create: {
        inscripcionId,
        numero,
        tipo: data.tipo,
        nota: data.nota,
        observaciones: data.observaciones ?? null,
      },
    });
  },

  /** Elimina una nota parcial específica. */
  async delete(inscripcionId: string, numero: number, tipo: string) {
    const existing = await prisma.notaParcial.findUnique({
      where: { inscripcionId_numero_tipo: { inscripcionId, numero, tipo } },
    });
    if (!existing) throw HttpError.notFound('Nota parcial no encontrada');
    return prisma.notaParcial.delete({
      where: { inscripcionId_numero_tipo: { inscripcionId, numero, tipo } },
    });
  },
};
