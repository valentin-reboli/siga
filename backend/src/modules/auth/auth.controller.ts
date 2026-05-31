import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { HttpError } from '../../utils/httpError';

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
      res.json(result);
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
