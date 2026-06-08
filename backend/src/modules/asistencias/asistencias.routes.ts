import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, PERMISSIONS } from '../../auth/permissions';
import { validate } from '../../middleware/validate';
import { asistenciasController } from './asistencias.controller';
import {
  cicloQuerySchema,
  guardarAsistenciaSchema,
  rosterQuerySchema,
} from './asistencias.schemas';

const router = Router();

// Toda la gestión de asistencia requiere estar autenticado y tener el permiso.
// El alumno no tiene ASISTENCIAS_TAKE, así que queda fuera. El docente sí, pero
// el service lo acota a SUS materias (ownership check).
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.ASISTENCIAS_TAKE));

// Roster de la cursada (con el estado del día si se pasa ?fecha=).
router.get(
  '/materias/:materiaId/roster',
  validate(rosterQuerySchema, 'query'),
  asistenciasController.roster,
);

// Guardar la asistencia de una clase (upsert masivo).
router.post(
  '/materias/:materiaId',
  validate(guardarAsistenciaSchema),
  asistenciasController.guardar,
);

// Resumen por alumno (% de asistencia) y listado de clases ya tomadas.
router.get(
  '/materias/:materiaId/resumen',
  validate(cicloQuerySchema, 'query'),
  asistenciasController.resumen,
);
router.get(
  '/materias/:materiaId/clases',
  validate(cicloQuerySchema, 'query'),
  asistenciasController.clases,
);

export const asistenciasRoutes = router;
