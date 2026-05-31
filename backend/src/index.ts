import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  const app = createApp();

  // Validamos conexión a la BD antes de arrancar
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('[DB] Conexión a PostgreSQL establecida');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[DB] No se pudo conectar a la base de datos:', err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[SIGA] Backend escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n[${signal}] Cerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[FATAL]', err);
  process.exit(1);
});
