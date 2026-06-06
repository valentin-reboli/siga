import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { calendarioController } from './calendario.controller';
import { listCalendarioQuerySchema } from './calendario.schemas';

const router = Router();
router.use(authenticate);

// Eventos del calendario del usuario (exámenes del foro + mesas de examen).
router.get('/', validate(listCalendarioQuerySchema, 'query'), calendarioController.list);

export { router as calendarioRoutes };
