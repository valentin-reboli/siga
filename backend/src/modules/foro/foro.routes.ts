import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { foroController } from './foro.controller';
import { upload } from './foro.storage';
import {
  createComentarioSchema,
  createPublicacionSchema,
  listPublicacionesQuerySchema,
  updatePublicacionSchema,
} from './foro.schemas';

const router = Router();


router.use(authenticate);


const canPublish = requirePermission(PERMISSIONS.MATERIA_FORO_PUBLISH);


router.get('/agenda', foroController.agenda);


router.get(
  '/materias/:materiaId/publicaciones',
  validate(listPublicacionesQuerySchema, 'query'),
  foroController.list,
);

router.post(
  '/materias/:materiaId/publicaciones',
  canPublish,
  upload.array('archivos', 10),
  validate(createPublicacionSchema),
  foroController.create,
);

// ── Publicación individual ────────────────────────────────────────────────
router.get('/publicaciones/:id', foroController.getById);
router.patch(
  '/publicaciones/:id',
  canPublish,
  validate(updatePublicacionSchema),
  foroController.update,
);
router.delete('/publicaciones/:id', canPublish, foroController.remove);

// ── Adjuntos ──────────────────────────────────────────────────────────────
router.post(
  '/publicaciones/:id/adjuntos',
  canPublish,
  upload.array('archivos', 10),
  foroController.addAdjuntos,
);
router.get('/adjuntos/:id/download', foroController.downloadAdjunto);
router.delete('/adjuntos/:id', canPublish, foroController.removeAdjunto);

// ── Comentarios ───────────────────────────────────────────────────────────
router.post(
  '/publicaciones/:id/comentarios',
  canPublish,
  validate(createComentarioSchema),
  foroController.addComentario,
);
router.delete('/comentarios/:id', canPublish, foroController.removeComentario);

export { router as foroRoutes };
