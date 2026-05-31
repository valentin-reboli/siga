import { Request, Response, NextFunction } from 'express';
import { inscripcionesService } from './inscripciones.service';
import { HttpError } from '../../utils/httpError';
import { RolUsuario } from '@prisma/client';
import { alumnosService } from '../alumnos/alumnos.service';

export const inscripcionesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      // Si el solicitante es ALUMNO, debe inscribirse a sí mismo
      if (req.user.rol === RolUsuario.ALUMNO) {
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        if (propio.id !== req.body.alumnoId) {
          throw HttpError.forbidden('Solo podés inscribirte a vos mismo');
        }
      }
      res.status(201).json(await inscripcionesService.create(req.body));
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const query = { ...(req.query as any) };
      // El alumno solo ve las propias
      if (req.user.rol === RolUsuario.ALUMNO) {
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        query.alumnoId = propio.id;
      }
      res.json(await inscripcionesService.list(query));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await inscripcionesService.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await inscripcionesService.cancel(req.params.id));
    } catch (err) {
      next(err);
    }
  },
};
