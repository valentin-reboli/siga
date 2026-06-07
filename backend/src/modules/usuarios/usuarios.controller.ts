import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';
import { usuariosService } from './usuarios.service';
import { HttpError } from '../../utils/httpError';
import { hasPermission, PERMISSIONS } from '../../auth/permissions';
import { registrarAuditoria, AUDIT } from '../../utils/audit';

/** Solo un SUPERADMIN puede gestionar a otro SUPERADMIN. */
function puedeGestionar(actorRol: RolUsuario, targetRol: RolUsuario): boolean {
  if (targetRol === RolUsuario.SUPERADMIN) return actorRol === RolUsuario.SUPERADMIN;
  return true;
}

export const usuariosController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json(await usuariosService.list(req.query as any)); } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try { res.json(await usuariosService.getById(req.params.id)); } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const actor = req.user;
      const target = await usuariosService.getById(req.params.id);

      if (!puedeGestionar(actor.rol, target.rol)) {
        throw HttpError.forbidden('No tenés permisos para gestionar a un superadmin');
      }
      const nuevoRol = req.body.rol as RolUsuario | undefined;
      if (nuevoRol === RolUsuario.SUPERADMIN && actor.rol !== RolUsuario.SUPERADMIN) {
        throw HttpError.forbidden('Solo un superadmin puede asignar el rol SUPERADMIN');
      }
      if (req.params.id === actor.sub) {
        if (req.body.activo === false) throw HttpError.badRequest('No podés desactivar tu propia cuenta');
        if (nuevoRol && nuevoRol !== actor.rol) throw HttpError.badRequest('No podés cambiar tu propio rol');
      }

      const actualizado = await usuariosService.update(req.params.id, req.body);
      const cambioRol = !!nuevoRol && nuevoRol !== target.rol;
      await registrarAuditoria({
        accion: cambioRol ? AUDIT.USER_ROLE_CHANGED : AUDIT.USER_UPDATED,
        actorId: actor.sub,
        actorEmail: actor.email,
        targetId: target.id,
        targetNombre: `${target.nombre} ${target.apellido}`,
        descripcion: cambioRol
          ? `Cambió el rol de ${target.rol} a ${nuevoRol}`
          : 'Editó los datos del usuario',
        ip: req.ip,
      });
      res.json(actualizado);
    } catch (err) { next(err); }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const actor = req.user;
      if (req.params.id === actor.sub) throw HttpError.badRequest('No podés desactivar tu propia cuenta');
      const target = await usuariosService.getById(req.params.id);
      if (!puedeGestionar(actor.rol, target.rol)) {
        throw HttpError.forbidden('No tenés permisos para gestionar a un superadmin');
      }
      const result = await usuariosService.deactivate(req.params.id);
      await registrarAuditoria({
        accion: AUDIT.USER_DEACTIVATED,
        actorId: actor.sub,
        actorEmail: actor.email,
        targetId: target.id,
        targetNombre: `${target.nombre} ${target.apellido}`,
        descripcion: 'Suspendió la cuenta',
        ip: req.ip,
      });
      res.json(result);
    } catch (err) { next(err); }
  },

  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const actor = req.user;
      const target = await usuariosService.getById(req.params.id);
      if (!puedeGestionar(actor.rol, target.rol)) {
        throw HttpError.forbidden('No tenés permisos para gestionar a un superadmin');
      }
      const result = await usuariosService.reactivate(req.params.id);
      await registrarAuditoria({
        accion: AUDIT.USER_REACTIVATED,
        actorId: actor.sub,
        actorEmail: actor.email,
        targetId: target.id,
        targetNombre: `${target.nombre} ${target.apellido}`,
        descripcion: 'Reactivó la cuenta',
        ip: req.ip,
      });
      res.json(result);
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const actor = req.user;
      const target = await usuariosService.getById(req.params.id);
      if (!puedeGestionar(actor.rol, target.rol)) {
        throw HttpError.forbidden('No tenés permisos para gestionar a un superadmin');
      }
      const result = await usuariosService.resetPassword(req.params.id);
      await registrarAuditoria({
        accion: AUDIT.PASSWORD_RESET,
        actorId: actor.sub,
        actorEmail: actor.email,
        targetId: target.id,
        targetNombre: `${target.nombre} ${target.apellido}`,
        descripcion: 'Restableció la contraseña',
        ip: req.ip,
      });
      res.json(result);
    } catch (err) { next(err); }
  },

  async createAlumno(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuariosService.createAlumno(req.body);
      await registrarAuditoria({
        accion: AUDIT.USER_CREATED,
        actorId: req.user?.sub,
        actorEmail: req.user?.email,
        targetId: result.alumno.usuario.id,
        targetNombre: `${result.alumno.nombre} ${result.alumno.apellido}`,
        descripcion: 'Creó un alumno',
        ip: req.ip,
      });
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuariosService.createStaff(req.body);
      await registrarAuditoria({
        accion: AUDIT.USER_CREATED,
        actorId: req.user?.sub,
        actorEmail: req.user?.email,
        targetId: result.usuario.id,
        targetNombre: `${result.usuario.nombre} ${result.usuario.apellido}`,
        descripcion: `Creó un usuario de staff (${result.usuario.rol})`,
        ip: req.ip,
      });
      res.status(201).json(result);
    } catch (err) { next(err); }
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

  /**
   * Perfil público de un docente: cualquier usuario autenticado puede ver
   * nombre, apellido y materias asignadas (sin datos sensibles).
   * Solo funciona para usuarios con rol DOCENTE.
   */
  async getPerfilPublico(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw HttpError.unauthorized();
      const usuario = await usuariosService.getById(req.params.id);
      if (usuario.rol !== RolUsuario.DOCENTE) {
        throw HttpError.forbidden('Este perfil no es público');
      }
      const materias = await usuariosService.getMaterias(req.params.id);
      res.json({
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        avatarUrl: usuario.avatarUrl ?? null,
        materias,
      });
    } catch (err) { next(err); }
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
};
