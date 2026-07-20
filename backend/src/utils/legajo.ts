import { Prisma } from '@prisma/client';


export async function generarLegajo(
  tx: Prisma.TransactionClient,
  anioIngreso: number,
): Promise<string> {
  const prefijo = `${anioIngreso}-`;
  const existentes = await tx.alumno.findMany({
    where: { legajo: { startsWith: prefijo } },
    select: { legajo: true },
  });

  let max = 0;
  for (const a of existentes) {
    const sufijo = a.legajo.slice(prefijo.length);
    const n = Number.parseInt(sufijo, 10);
    if (Number.isInteger(n) && n > max) max = n;
  }

  return `${prefijo}${String(max + 1).padStart(4, '0')}`;
}
