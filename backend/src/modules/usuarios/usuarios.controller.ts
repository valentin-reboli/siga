import { Request, Response, NextFunction } from 'express';
import { usuariosService } from './usuarios.service';

export const usuariosController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuariosService.list(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuariosService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuariosService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuariosService.deactivate(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
