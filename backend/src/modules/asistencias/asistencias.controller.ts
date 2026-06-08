import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';
import { HttpError } from '../../utils/httpError';
import { asistenciasService } from './asistencias.service';
import { CicloQuery, GuardarAsistenciaInput, RosterQuery } from './asistencias.schemas';

export const asistenciasController = {
  // GET /asistencias/materias/:materiaId/roster?cicloLectivo=&fecha=
  async roster(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const { materiaId } = req.params;
      const { cicloLectivo, fecha } = req.query as unknown as RosterQuery;
      await asistenciasService.assertAccesoMateria(materiaId, req.user.sub, req.user.rol as RolUsuario);
      res.json(await asistenciasService.roster(materiaId, cicloLectivo, fecha));
    } catch (err) {
      next(err);
    }
  },

  // POST /asistencias/materias/:materiaId
  async guardar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const { materiaId } = req.params;
      const data = req.body as GuardarAsistenciaInput;
      await asistenciasService.assertAccesoMateria(materiaId, req.user.sub, req.user.rol as RolUsuario);
      res.json(await asistenciasService.guardar(materiaId, data));
    } catch (err) {
      next(err);
    }
  },

  // GET /asistencias/materias/:materiaId/resumen?cicloLectivo=
  async resumen(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const { materiaId } = req.params;
      const { cicloLectivo } = req.query as unknown as CicloQuery;
      await asistenciasService.assertAccesoMateria(materiaId, req.user.sub, req.user.rol as RolUsuario);
      res.json(await asistenciasService.resumen(materiaId, cicloLectivo));
    } catch (err) {
      next(err);
    }
  },

  // GET /asistencias/materias/:materiaId/clases?cicloLectivo=
  async clases(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const { materiaId } = req.params;
      const { cicloLectivo } = req.query as unknown as CicloQuery;
      await asistenciasService.assertAccesoMateria(materiaId, req.user.sub, req.user.rol as RolUsuario);
      res.json(await asistenciasService.clases(materiaId, cicloLectivo));
    } catch (err) {
      next(err);
    }
  },
};
