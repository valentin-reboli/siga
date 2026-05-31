import { Request, Response, NextFunction } from 'express';
import { constanciasService } from './constancias.service';
import { HttpError } from '../../utils/httpError';
import { RolUsuario } from '@prisma/client';
import { alumnosService } from '../alumnos/alumnos.service';

export const constanciasController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      // Si es alumno, solo puede solicitar para sí mismo
      if (req.user.rol === RolUsuario.ALUMNO) {
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        if (propio.id !== req.body.alumnoId) {
          throw HttpError.forbidden('Solo podés solicitar constancias para vos mismo');
        }
      }
      res.status(201).json(await constanciasService.create(req.body));
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const query = { ...(req.query as any) };
      if (req.user.rol === RolUsuario.ALUMNO) {
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        query.alumnoId = propio.id;
      }
      res.json(await constanciasService.list(query));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await constanciasService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await constanciasService.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  async emitir(req: Request, res: Response, next: NextFunction) {
    try {
      const { constancia } = await constanciasService.emitir(req.params.id);
      res.json(constancia);
    } catch (err) {
      next(err);
    }
  },

  async getPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const pdf = await constanciasService.getPdf(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="constancia-${req.params.id}.pdf"`,
      );
      res.send(pdf);
    } catch (err) {
      next(err);
    }
  },

  async verificar(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await constanciasService.verificar(req.params.codigo));
    } catch (err) {
      next(err);
    }
  },
};
