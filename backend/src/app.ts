import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { usuariosRoutes } from './modules/usuarios/usuarios.routes';
import { alumnosRoutes } from './modules/alumnos/alumnos.routes';
import { materiasRoutes } from './modules/materias/materias.routes';
import { inscripcionesRoutes } from './modules/inscripciones/inscripciones.routes';
import { constanciasRoutes } from './modules/constancias/constancias.routes';
import { foroRoutes } from './modules/foro/foro.routes';

export function createApp() {
  const app = express();

  // Seguridad y utilidades
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Healthcheck
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'siga-backend', timestamp: new Date().toISOString() });
  });

  // Rutas de API
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/alumnos', alumnosRoutes);
  app.use('/api/materias', materiasRoutes);
  app.use('/api/inscripciones', inscripcionesRoutes);
  app.use('/api/constancias', constanciasRoutes);
  app.use('/api/foro', foroRoutes);

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Manejo central de errores
  app.use(errorHandler);

  return app;
}
