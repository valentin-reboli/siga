import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { HttpError } from '../../utils/httpError';
import { registrarAuditoria, AUDIT } from '../../utils/audit';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const usuario = await authService.register(req.body);
      res.status(201).json(usuario);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      await registrarAuditoria({
        accion: AUDIT.LOGIN,
        actorId: result.usuario.id,
        actorEmail: result.usuario.email,
        targetId: result.usuario.id,
        targetNombre: `${result.usuario.nombre} ${result.usuario.apellido}`,
        descripcion: 'Inició sesión',
        ip: req.ip,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      await authService.changePassword(req.user.sub, req.body);
      await registrarAuditoria({
        accion: AUDIT.UPDATE,
        actorId: req.user.sub,
        actorEmail: req.user.email,
        targetId: req.user.sub,
        targetNombre: req.user.email,
        descripcion: 'Cambió su contraseña',
        ip: req.ip,
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const usuario = await authService.me(req.user.sub);
      res.json(usuario);
    } catch (err) {
      next(err);
    }
  },
};
