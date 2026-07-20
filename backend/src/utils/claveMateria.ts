
export function claveMateriaSlug(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') 
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); 
  return `${base}123`;
}


export function claveMateriaEsperada(nombre: string, claveInscripcion?: string | null): string {
  const propia = claveInscripcion?.trim();
  return propia && propia.length > 0 ? propia : claveMateriaSlug(nombre);
}


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
