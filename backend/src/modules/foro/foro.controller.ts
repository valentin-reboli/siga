import { Request, Response, NextFunction } from 'express';
import { foroService } from './foro.service';
import { resolveStoredPath } from './foro.storage';
import { HttpError } from '../../utils/httpError';

export const foroController = {
  // GET /foro/agenda — próximos exámenes y novedades de las materias del usuario
  async agenda(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await foroService.agenda(req.user!));
    } catch (err) {
      next(err);
    }
  },

  // GET /materias/:materiaId/foro/publicaciones
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { materiaId } = req.params;
      const materia = await foroService.getMateriaOr404(materiaId);
      await foroService.assertPuedeVerForo(req.user!, materiaId);
      const [data, puedePublicar] = await Promise.all([
        foroService.listPublicaciones(materiaId, req.query as any),
        foroService.puedePublicar(req.user!, materiaId),
      ]);
      res.json({ materia, puedePublicar, ...data });
    } catch (err) {
      next(err);
    }
  },

  // GET /foro/publicaciones/:id
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const pub = await foroService.getPublicacion(req.params.id);
      await foroService.assertPuedeVerForo(req.user!, pub.materiaId);
      const puedePublicar = await foroService.puedePublicar(req.user!, pub.materiaId);
      res.json({ ...pub, puedePublicar });
    } catch (err) {
      next(err);
    }
  },

  // POST /materias/:materiaId/foro/publicaciones  (multipart, campo "archivos")
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { materiaId } = req.params;
      await foroService.getMateriaOr404(materiaId);
      await foroService.assertPuedePublicar(req.user!, materiaId);
      const files = (req.files as Express.Multer.File[]) ?? [];
      const pub = await foroService.createPublicacion(req.user!, materiaId, req.body, files);
      res.status(201).json(pub);
    } catch (err) {
      next(err);
    }
  },

  // PATCH /foro/publicaciones/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await foroService.updatePublicacion(req.user!, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  // DELETE /foro/publicaciones/:id
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await foroService.deletePublicacion(req.user!, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // POST /foro/publicaciones/:id/adjuntos  (multipart, campo "archivos")
  async addAdjuntos(req: Request, res: Response, next: NextFunction) {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (files.length === 0) throw HttpError.badRequest('No se adjuntó ningún archivo');
      res.status(201).json(await foroService.addAdjuntos(req.user!, req.params.id, files));
    } catch (err) {
      next(err);
    }
  },

  // DELETE /foro/adjuntos/:id
  async removeAdjunto(req: Request, res: Response, next: NextFunction) {
    try {
      await foroService.deleteAdjunto(req.user!, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // GET /foro/adjuntos/:id/download
  async downloadAdjunto(req: Request, res: Response, next: NextFunction) {
    try {
      const adj = await foroService.getAdjuntoForDownload(req.params.id);
      await foroService.assertPuedeVerForo(req.user!, adj.publicacion.materiaId);
      const abs = resolveStoredPath(adj.nombreAlmacenado);
      res.download(abs, adj.nombreOriginal, (err) => {
        if (err && !res.headersSent) {
          next(HttpError.notFound('El archivo ya no está disponible'));
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /foro/publicaciones/:id/comentarios
  async addComentario(req: Request, res: Response, next: NextFunction) {
    try {
      res
        .status(201)
        .json(await foroService.createComentario(req.user!, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  // DELETE /foro/comentarios/:id
  async removeComentario(req: Request, res: Response, next: NextFunction) {
    try {
      await foroService.deleteComentario(req.user!, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
