import { v4 as uuidv4 } from 'uuid';
import { Prisma, EstadoConstancia } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import {
  CreateConstanciaInput,
  ListConstanciasQuery,
  UpdateConstanciaInput,
} from './constancias.schemas';
import { generarConstanciaPDF } from './pdf.generator';

const constanciaInclude = {
  alumno: {
    select: {
      id: true,
      legajo: true,
      dni: true,
      nombre: true,
      apellido: true,
      carrera: true,
      anioIngreso: true,
    },
  },
} satisfies Prisma.ConstanciaInclude;

function generarCodigoVerificacion(): string {
  // Código alfanumérico corto basado en uuid
  return uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase();
}

export const constanciasService = {
  async create(data: CreateConstanciaInput) {
    const alumno = await prisma.alumno.findUnique({ where: { id: data.alumnoId } });
    if (!alumno) throw HttpError.notFound('Alumno no encontrado');

    return prisma.constancia.create({
      data: {
        alumnoId: data.alumnoId,
        tipo: data.tipo,
        motivo: data.motivo,
        codigoVerificacion: generarCodigoVerificacion(),
      },
      include: constanciaInclude,
    });
  },

  async list(query: ListConstanciasQuery) {
    const where: Prisma.ConstanciaWhereInput = {};
    if (query.alumnoId) where.alumnoId = query.alumnoId;
    if (query.tipo) where.tipo = query.tipo;
    if (query.estado) where.estado = query.estado;

    const [total, items] = await Promise.all([
      prisma.constancia.count({ where }),
      prisma.constancia.findMany({
        where,
        include: constanciaInclude,
        orderBy: { fechaSolicitud: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { total, page: query.page, pageSize: query.pageSize, items };
  },

  async getById(id: string) {
    const constancia = await prisma.constancia.findUnique({
      where: { id },
      include: constanciaInclude,
    });
    if (!constancia) throw HttpError.notFound('Constancia no encontrada');
    return constancia;
  },

  async update(id: string, data: UpdateConstanciaInput) {
    return prisma.constancia.update({
      where: { id },
      data,
      include: constanciaInclude,
    });
  },

  // Genera el PDF y marca la constancia como EMITIDA.
  async emitir(id: string) {
    const constancia = await this.getById(id);
    if (constancia.estado === EstadoConstancia.EMITIDA) {
      throw HttpError.conflict('La constancia ya fue emitida');
    }

    const pdfBuffer = await generarConstanciaPDF({
      tipo: constancia.tipo,
      codigoVerificacion: constancia.codigoVerificacion,
      fechaEmision: new Date(),
      alumno: constancia.alumno,
    });

    const actualizada = await prisma.constancia.update({
      where: { id },
      data: {
        estado: EstadoConstancia.EMITIDA,
        fechaEmision: new Date(),
        // En producción acá se subiría a S3/Render storage y se guardaría la URL.
        // Para esta entrega exponemos un endpoint /constancias/:id/pdf que regenera el PDF.
        archivoUrl: `/api/constancias/${id}/pdf`,
      },
      include: constanciaInclude,
    });

    return { constancia: actualizada, pdfBuffer };
  },

  async getPdf(id: string) {
    const constancia = await this.getById(id);
    return generarConstanciaPDF({
      tipo: constancia.tipo,
      codigoVerificacion: constancia.codigoVerificacion,
      fechaEmision: constancia.fechaEmision ?? new Date(),
      alumno: constancia.alumno,
    });
  },

  async cancelar(id: string, alumnoId: string | null) {
    const constancia = await this.getById(id);
    // Solo el alumno dueño (o staff) puede cancelar
    if (alumnoId !== null && constancia.alumnoId !== alumnoId) {
      throw HttpError.forbidden('No podés cancelar esta constancia');
    }
    if (constancia.estado === EstadoConstancia.EMITIDA) {
      throw HttpError.conflict('No se puede cancelar una constancia ya emitida');
    }
    if (constancia.estado === EstadoConstancia.CANCELADA) {
      throw HttpError.conflict('La constancia ya está cancelada');
    }
    return prisma.constancia.update({
      where: { id },
      data: { estado: EstadoConstancia.CANCELADA },
      include: constanciaInclude,
    });
  },

  async verificar(codigo: string) {
    const constancia = await prisma.constancia.findUnique({
      where: { codigoVerificacion: codigo },
      include: constanciaInclude,
    });
    if (!constancia || constancia.estado !== EstadoConstancia.EMITIDA) {
      throw HttpError.notFound('Código de verificación inválido');
    }
    return {
      valido: true,
      tipo: constancia.tipo,
      alumno: {
        legajo: constancia.alumno.legajo,
        nombre: constancia.alumno.nombre,
        apellido: constancia.alumno.apellido,
        carrera: constancia.alumno.carrera,
      },
      fechaEmision: constancia.fechaEmision,
    };
  },
};
