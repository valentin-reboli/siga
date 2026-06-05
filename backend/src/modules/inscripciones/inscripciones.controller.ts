import { Request, Response, NextFunction } from 'express';
import { inscripcionesService } from './inscripciones.service';
import { HttpError } from '../../utils/httpError';
import { RolUsuario } from '@prisma/client';
import { hasPermission, PERMISSIONS } from '../../auth/permissions';
import { alumnosService } from '../alumnos/alumnos.service';
import { prisma } from '../../config/prisma';

export const inscripcionesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const esAlumno = req.user.rol === RolUsuario.ALUMNO;
      if (esAlumno) {
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        if (propio.id !== req.body.alumnoId) {
          throw HttpError.forbidden('Solo podés inscribirte a vos mismo');
        }
      } else if (!hasPermission(req.user.rol, PERMISSIONS.INSCRIPCIONES_VIEW_ALL)) {
        // Un docente no inscribe alumnos.
        throw HttpError.forbidden('No tenés permisos para inscribir alumnos');
      }
      // El alumno debe ingresar la clave de la materia; el staff queda exento.
      res.status(201).json(await inscripcionesService.create(req.body, { validarClave: esAlumno }));
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const query: any = { ...(req.query as any) };

      if (req.user.rol === RolUsuario.ALUMNO) {
        // Alumno ve solo las suyas
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        query.alumnoId = propio.id;

      } else if (req.user.rol === RolUsuario.DOCENTE) {
        // Docente ve solo las de sus materias asignadas
        const asignadas = await prisma.docenteMateria.findMany({
          where: { usuarioId: req.user.sub },
          select: { materiaId: true },
        });
        if (asignadas.length === 0) {
          return res.json({ total: 0, page: 1, pageSize: 50, items: [] });
        }
        query.materiaIds = asignadas.map((dm) => dm.materiaId);
      }
      // El staff con INSCRIPCIONES_VIEW_ALL (SUPERADMIN, ADMINISTRACION) ve todo.

      res.json(await inscripcionesService.list(query));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();

      // DOCENTE solo puede actualizar inscripciones de sus materias
      if (req.user.rol === RolUsuario.DOCENTE) {
        const inscripcion = await prisma.inscripcion.findUnique({
          where: { id: req.params.id },
          select: { materiaId: true },
        });
        if (!inscripcion) throw HttpError.notFound('Inscripción no encontrada');

        const asignada = await prisma.docenteMateria.findFirst({
          where: { usuarioId: req.user.sub, materiaId: inscripcion.materiaId },
        });
        if (!asignada) throw HttpError.forbidden('No tenés acceso a esta materia');
      }

      res.json(await inscripcionesService.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();

      // Antes cualquier alumno podía cancelar la inscripción de otro -> IDOR.
      // El alumno solo cancela las suyas; el staff con permiso, cualquiera.
      if (req.user.rol === RolUsuario.ALUMNO) {
        const inscripcion = await prisma.inscripcion.findUnique({
          where: { id: req.params.id },
          select: { alumnoId: true },
        });
        if (!inscripcion) throw HttpError.notFound('Inscripción no encontrada');
        const propio = await alumnosService.getByUsuarioId(req.user.sub);
        if (inscripcion.alumnoId !== propio.id) {
          throw HttpError.forbidden('Solo podés cancelar tus propias inscripciones');
        }
      } else if (!hasPermission(req.user.rol, PERMISSIONS.INSCRIPCIONES_VIEW_ALL)) {
        throw HttpError.forbidden('No tenés permisos para cancelar inscripciones');
      }

      res.json(await inscripcionesService.cancel(req.params.id));
    } catch (err) {
      next(err);
    }
  },
};
