import { Request, Response, NextFunction } from 'express';
import { materiasService } from './materias.service';

export const materiasController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await materiasService.create(req.body));
    } catch (err) {
      next(err);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await materiasService.list(req.query as any));
    } catch (err) {
      next(err);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await materiasService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await materiasService.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },
  async addCorrelatividad(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await materiasService.addCorrelatividad(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },
  async removeCorrelatividad(req: Request, res: Response, next: NextFunction) {
    try {
      await materiasService.removeCorrelatividad(req.params.correlatividadId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
