import { Request, Response, NextFunction } from 'express';
import { auditoriaService } from './auditoria.service';

export const auditoriaController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await auditoriaService.list(req.query as any));
    } catch (err) {
      next(err);
    }
  },
};
