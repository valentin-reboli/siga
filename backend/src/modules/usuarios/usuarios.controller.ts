import { Request, Response, NextFunction } from 'express';
import { usuariosService } from './usuarios.service';
import { HttpError } from '../../utils/httpError';
import { hasPermission, PERMISSIONS } from '../../auth/permissions';

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

  // Foto de perfil del propio usuario autenticado.
  async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      res.json(await usuariosService.updateAvatar(req.user.sub, req.body.avatar));
    } catch (err) { next(err); }
  },

  async removeAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      res.json(await usuariosService.removeAvatar(req.user.sub));
    } catch (err) { next(err); }
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
    try {
      if (!req.user) throw HttpError.unauthorized();
      // El usuario puede ver sus propias materias; el staff puede ver las de cualquiera.
      const esPropio = req.user.sub === req.params.id;
      if (!esPropio && !hasPermission(req.user.rol, PERMISSIONS.USERS_VIEW)) {
        throw HttpError.forbidden('No podés ver las materias de otro usuario');
      }
      res.json(await usuariosService.getMaterias(req.params.id));
    } catch (err) { next(err); }
  },
};
