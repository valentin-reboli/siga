import { Request, Response, NextFunction } from 'express';
import { constanciasService } from './constancias.service';
import { HttpError } from '../../utils/httpError';
import { RolUsuario } from '@prisma/client';
import { hasPermission, PERMISSIONS } from '../../auth/permissions';
import { alumnosService } from '../alumnos/alumnos.service';

/**
 * Verifica que el usuario pueda acceder a una constancia concreta:
 * el alumno dueño, o staff con permiso de gestión. Evita IDOR.
 */
async function assertPuedeVerConstancia(
  user: { sub: string; rol: RolUsuario },
  constanciaId: string,
): Promise<void> {
  if (hasPermission(user.rol, PERMISSIONS.CONSTANCIAS_MANAGE)) return;
  if (user.rol === RolUsuario.ALUMNO) {
    const constancia = await constanciasService.getById(constanciaId);
    const propio = await alumnosService.getByUsuarioId(user.sub);
    if (constancia.alumnoId === propio.id) return;
  }
  throw HttpError.forbidden('No tenés acceso a esta constancia');
}

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
      if (!req.user) throw HttpError.unauthorized();
      await assertPuedeVerConstancia(req.user, req.params.id);
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
      if (!req.user) throw HttpError.unauthorized();
      await assertPuedeVerConstancia(req.user, req.params.id);
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
