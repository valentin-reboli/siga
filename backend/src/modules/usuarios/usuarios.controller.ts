import { Request, Response, NextFunction } from 'express';
import { usuariosService } from './usuarios.service';

export const usuariosController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json(await usuariosService.list(req.query as any)); } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try { res.json(await usuariosService.getById(req.params.id)); } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json(await usuariosService.update(req.params.id, req.body)); } catch (err) { next(err); }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try { res.json(await usuariosService.deactivate(req.params.id)); } catch (err) { next(err); }
  },

  async createAlumno(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await usuariosService.createAlumno(req.body)); } catch (err) { next(err); }
  },

  async createStaff(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await usuariosService.createStaff(req.body)); } catch (err) { next(err); }
  },

  async assignMateria(req: Request, res: Response, next: NextFunction) {
    try {
      const { cicloLectivo } = req.body;
      res.status(201).json(
        await usuariosService.assignMateria(req.params.id, req.body.materiaId, cicloLectivo ?? 0),
      );
    } catch (err) { next(err); }
  },

  async removeMateria(req: Request, res: Response, next: NextFunction) {
    try {
      await usuariosService.removeMateria(req.params.id, req.params.materiaId, 0);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getMaterias(req: Request, res: Response, next: NextFunction) {
    try { res.json(await usuariosService.getMaterias(req.params.id)); } catch (err) { next(err); }
  },
};
