import { Prisma } from '@prisma/client';

/**
 * Genera el próximo número de legajo siguiendo la convención institucional:
 *
 *     AAAA-NNNN   (año de ingreso + correlativo de 4 dígitos)
 *     ej: 2026-0001, 2026-0002, ...
 *
 * Busca el mayor correlativo ya usado para ese año y devuelve el siguiente.
 * Debe llamarse dentro de la misma transacción que crea el alumno para evitar
 * condiciones de carrera. El campo legajo es @unique, así que ante una colisión
 * muy improbable Prisma devolverá P2002 y el alumno deberá reintentarse.
 */
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
