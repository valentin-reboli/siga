import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';
import { HttpError } from '../../utils/httpError';
import { notasService } from './notas.service';
import { upsertParcialSchema } from './notas.schemas';

export const notasController = {
  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const { id: inscripcionId, numero } = req.params;
      const numParcial = parseInt(numero, 10);
      if (isNaN(numParcial) || numParcial < 1 || numParcial > 20) {
        throw HttpError.badRequest('Número de parcial inválido (debe ser entre 1 y 20)');
      }
      await notasService.verificarAcceso(inscripcionId, req.user.sub, req.user.rol as RolUsuario);
      const data = upsertParcialSchema.parse(req.body);
      const result = await notasService.upsert(inscripcionId, numParcial, data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const { id: inscripcionId, numero } = req.params;
      const numParcial = parseInt(numero, 10);
      if (isNaN(numParcial) || numParcial < 1) {
        throw HttpError.badRequest('Número de parcial inválido');
      }
      const tipo = (req.query.tipo as string) || 'PARCIAL';
      await notasService.verificarAcceso(inscripcionId, req.user.sub, req.user.rol as RolUsuario);
      await notasService.delete(inscripcionId, numParcial, tipo);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
};
