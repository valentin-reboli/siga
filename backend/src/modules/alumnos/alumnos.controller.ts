import { Request, Response, NextFunction } from 'express';
import { alumnosService } from './alumnos.service';
import { HttpError } from '../../utils/httpError';
import { RolUsuario } from '@prisma/client';
import { hasPermission, PERMISSIONS } from '../../auth/permissions';

export const alumnosController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await alumnosService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await alumnosService.list(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await alumnosService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await alumnosService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async myProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const result = await alumnosService.getByUsuarioId(req.user.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateMyContact(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const result = await alumnosService.updateMyContact(req.user.sub, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Legajo del alumno. Un alumno solo puede ver el suyo;
   * staff puede ver cualquiera.
   */
  async getLegajo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const targetId = req.params.id;

      if (req.user.rol === RolUsuario.ALUMNO) {
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        if (propio.id !== targetId) {
          throw HttpError.forbidden('Solo podés acceder a tu propio legajo');
        }
      } else if (!hasPermission(req.user.rol, PERMISSIONS.STUDENTS_VIEW)) {
        // Un docente, por ejemplo, no puede leer legajos arbitrarios.
        throw HttpError.forbidden('No tenés permisos para ver este legajo');
      }

      const result = await alumnosService.getLegajo(targetId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
