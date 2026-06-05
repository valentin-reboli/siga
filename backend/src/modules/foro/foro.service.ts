import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { HttpError } from '../../utils/httpError';
import { JwtPayload } from '../../utils/jwt';
import { isStaff } from '../../auth/permissions';
import { deleteStoredFile } from './foro.storage';
import {
  CreateComentarioInput,
  CreatePublicacionInput,
  ListPublicacionesQuery,
  UpdatePublicacionInput,
} from './foro.schemas';

// Datos públicos del autor que se devuelven junto a publicaciones/comentarios.
const autorSelect = {
  select: { id: true, nombre: true, apellido: true, rol: true },
} satisfies Prisma.UsuarioDefaultArgs;

const adjuntoSelect = {
  select: {
    id: true,
    nombreOriginal: true,
    mimeType: true,
    tamano: true,
    creadoEn: true,
  },
} satisfies Prisma.AdjuntoDefaultArgs;

/** Normaliza el nombre original del archivo (multer lo entrega en latin1). */
function decodeName(name: string): string {
  return Buffer.from(name, 'latin1').toString('utf8');
}

export const foroService = {
  /** Devuelve la materia o lanza 404. */
  async getMateriaOr404(materiaId: string) {
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
      select: { id: true, codigo: true, nombre: true, carrera: true, anio: true, cuatrimestre: true },
    });
    if (!materia) throw HttpError.notFound('Materia no encontrada');
    return materia;
  },

  /**
   * ¿Este usuario puede publicar/comentar en el foro de esta materia?
   * - SUPERADMIN / ADMINISTRACION: siempre.
   * - DOCENTE: solo si tiene la materia asignada (DocenteMateria).
   * - ALUMNO: nunca (solo lectura).
   */
  async puedePublicar(user: JwtPayload, materiaId: string): Promise<boolean> {
    if (isStaff(user.rol)) return true;
    if (user.rol !== 'DOCENTE') return false;
    const asignacion = await prisma.docenteMateria.findFirst({
      where: { usuarioId: user.sub, materiaId },
      select: { id: true },
    });
    return Boolean(asignacion);
  },

  /** Igual que puedePublicar pero lanza 403 si no está permitido. */
  async assertPuedePublicar(user: JwtPayload, materiaId: string): Promise<void> {
    const ok = await this.puedePublicar(user, materiaId);
    if (!ok) {
      throw HttpError.forbidden('No tenés permisos para publicar en esta materia');
    }
  },

  /** Lista las publicaciones de una materia (fijadas primero, luego recientes). */
  async listPublicaciones(materiaId: string, query: ListPublicacionesQuery) {
    const where: Prisma.PublicacionWhereInput = { materiaId };
    if (query.tipo) where.tipo = query.tipo;
    if (query.q) {
      where.OR = [
        { titulo: { contains: query.q, mode: 'insensitive' } },
        { contenido: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.publicacion.count({ where }),
      prisma.publicacion.findMany({
        where,
        include: {
          autor: autorSelect,
          adjuntos: adjuntoSelect,
          _count: { select: { comentarios: true } },
        },
        orderBy: [{ fijado: 'desc' }, { creadoEn: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return { total, page: query.page, pageSize: query.pageSize, items };
  },

  /** Una publicación con sus adjuntos y comentarios (con autores). */
  async getPublicacion(id: string) {
    const pub = await prisma.publicacion.findUnique({
      where: { id },
      include: {
        autor: autorSelect,
        adjuntos: adjuntoSelect,
        comentarios: {
          include: { autor: autorSelect },
          orderBy: { creadoEn: 'asc' },
        },
        materia: { select: { id: true, codigo: true, nombre: true } },
      },
    });
    if (!pub) throw HttpError.notFound('Publicación no encontrada');
    return pub;
  },

  /** Crea una publicación (con adjuntos opcionales). */
  async createPublicacion(
    user: JwtPayload,
    materiaId: string,
    data: CreatePublicacionInput,
    files: Express.Multer.File[] = [],
  ) {
    return prisma.publicacion.create({
      data: {
        materiaId,
        autorId: user.sub,
        tipo: data.tipo,
        titulo: data.titulo,
        contenido: data.contenido,
        fijado: data.fijado ?? false,
        adjuntos: {
          create: files.map((f) => ({
            nombreOriginal: decodeName(f.originalname),
            nombreAlmacenado: f.filename,
            mimeType: f.mimetype,
            tamano: f.size,
          })),
        },
      },
      include: { autor: autorSelect, adjuntos: adjuntoSelect },
    });
  },

  /** Edita título/contenido/tipo/fijado. Autor o staff. */
  async updatePublicacion(user: JwtPayload, id: string, data: UpdatePublicacionInput) {
    const pub = await prisma.publicacion.findUnique({
      where: { id },
      select: { id: true, autorId: true },
    });
    if (!pub) throw HttpError.notFound('Publicación no encontrada');
    if (pub.autorId !== user.sub && !isStaff(user.rol)) {
      throw HttpError.forbidden('Solo el autor o el staff pueden editar esta publicación');
    }
    return prisma.publicacion.update({
      where: { id },
      data,
      include: { autor: autorSelect, adjuntos: adjuntoSelect },
    });
  },

  /** Elimina una publicación y sus archivos del disco. Autor o staff. */
  async deletePublicacion(user: JwtPayload, id: string) {
    const pub = await prisma.publicacion.findUnique({
      where: { id },
      select: {
        id: true,
        autorId: true,
        adjuntos: { select: { nombreAlmacenado: true } },
      },
    });
    if (!pub) throw HttpError.notFound('Publicación no encontrada');
    if (pub.autorId !== user.sub && !isStaff(user.rol)) {
      throw HttpError.forbidden('Solo el autor o el staff pueden eliminar esta publicación');
    }
    // Cascade borra adjuntos y comentarios en DB; borramos los archivos físicos.
    await prisma.publicacion.delete({ where: { id } });
    pub.adjuntos.forEach((a) => deleteStoredFile(a.nombreAlmacenado));
  },

  /** Agrega adjuntos a una publicación existente. Autor o staff. */
  async addAdjuntos(user: JwtPayload, publicacionId: string, files: Express.Multer.File[]) {
    const pub = await prisma.publicacion.findUnique({
      where: { id: publicacionId },
      select: { id: true, autorId: true },
    });
    if (!pub) throw HttpError.notFound('Publicación no encontrada');
    if (pub.autorId !== user.sub && !isStaff(user.rol)) {
      throw HttpError.forbidden('Solo el autor o el staff pueden adjuntar archivos');
    }
    await prisma.adjunto.createMany({
      data: files.map((f) => ({
        publicacionId,
        nombreOriginal: decodeName(f.originalname),
        nombreAlmacenado: f.filename,
        mimeType: f.mimetype,
        tamano: f.size,
      })),
    });
    return prisma.adjunto.findMany({ where: { publicacionId }, ...adjuntoSelect });
  },

  /** Elimina un adjunto (DB + disco). Autor de la publicación o staff. */
  async deleteAdjunto(user: JwtPayload, adjuntoId: string) {
    const adj = await prisma.adjunto.findUnique({
      where: { id: adjuntoId },
      select: { id: true, nombreAlmacenado: true, publicacion: { select: { autorId: true } } },
    });
    if (!adj) throw HttpError.notFound('Adjunto no encontrado');
    if (adj.publicacion.autorId !== user.sub && !isStaff(user.rol)) {
      throw HttpError.forbidden('Solo el autor o el staff pueden eliminar este archivo');
    }
    await prisma.adjunto.delete({ where: { id: adjuntoId } });
    deleteStoredFile(adj.nombreAlmacenado);
  },

  /** Datos de un adjunto para descargarlo (cualquier usuario autenticado). */
  async getAdjuntoForDownload(adjuntoId: string) {
    const adj = await prisma.adjunto.findUnique({
      where: { id: adjuntoId },
      select: { id: true, nombreOriginal: true, nombreAlmacenado: true, mimeType: true },
    });
    if (!adj) throw HttpError.notFound('Archivo no encontrado');
    return adj;
  },

  /** Crea un comentario. Requiere permiso de publicación en la materia. */
  async createComentario(user: JwtPayload, publicacionId: string, data: CreateComentarioInput) {
    const pub = await prisma.publicacion.findUnique({
      where: { id: publicacionId },
      select: { id: true, materiaId: true },
    });
    if (!pub) throw HttpError.notFound('Publicación no encontrada');
    await this.assertPuedePublicar(user, pub.materiaId);

    return prisma.comentario.create({
      data: { publicacionId, autorId: user.sub, contenido: data.contenido },
      include: { autor: autorSelect },
    });
  },

  /** Elimina un comentario. Autor o staff. */
  async deleteComentario(user: JwtPayload, comentarioId: string) {
    const c = await prisma.comentario.findUnique({
      where: { id: comentarioId },
      select: { id: true, autorId: true },
    });
    if (!c) throw HttpError.notFound('Comentario no encontrado');
    if (c.autorId !== user.sub && !isStaff(user.rol)) {
      throw HttpError.forbidden('Solo el autor o el staff pueden eliminar este comentario');
    }
    await prisma.comentario.delete({ where: { id: comentarioId } });
  },
};
