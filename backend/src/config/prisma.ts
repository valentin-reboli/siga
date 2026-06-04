import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Singleton del cliente Prisma. Se reusa entre hot-reloads en desarrollo
// para no abrir conexiones de mas a la base.

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;