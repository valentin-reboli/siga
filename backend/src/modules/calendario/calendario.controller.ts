import { Request, Response, NextFunction } from 'express';
import { calendarioService } from './calendario.service';
import { ListCalendarioQuery } from './calendario.schemas';

export const calendarioController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { desde, hasta } = req.query as unknown as ListCalendarioQuery;
      const eventos = await calendarioService.eventos(req.user!, desde, hasta);
      res.json({ eventos });
    } catch (err) {
      next(err);
    }
  },
};
