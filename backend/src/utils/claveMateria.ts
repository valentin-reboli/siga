/**
 * Clave de inscripción de una materia.
 *
 * Por ahora, la convención simula la clave que el docente entrega al inicio del
 * cursado: el nombre de la materia sin espacios ni acentos, en minúsculas, con
 * el sufijo "123".
 *   "Práctica Profesional II" -> "practicaprofesionalii123"
 */
export function claveMateriaSlug(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca acentos (marcas diacríticas)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // saca espacios y símbolos
  return `${base}123`;
}

/**
 * Clave esperada para inscribirse: la configurada por el docente
 * (claveInscripcion) o, si no hay, la derivada del nombre.
 */
export function claveMateriaEsperada(nombre: string, claveInscripcion?: string | null): string {
  const propia = claveInscripcion?.trim();
  return propia && propia.length > 0 ? propia : claveMateriaSlug(nombre);
}

/** Compara la clave provista con la esperada (sin distinguir mayúsculas). */
export function claveMateriaCoincide(
  provista: string | undefined | null,
  nombre: string,
  claveInscripcion?: string | null,
): boolean {
  if (!provista) return false;
  return (
    provista.trim().toLowerCase() === claveMateriaEsperada(nombre, claveInscripcion).toLowerCase()
  );
}
