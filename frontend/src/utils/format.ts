/**
 * Devuelve las iniciales de un nombre para usar en avatares.
 * Ej: ("Valentín", "Réboli") -> "VR"
 */
export function getIniciales(nombre: string, apellido?: string): string {
  const n = nombre.trim().charAt(0).toUpperCase();
  const a = (apellido ?? '').trim().charAt(0).toUpperCase();
  return (n + a) || '?';
}

/** Formatea una fecha ISO al formato corto AR (dd/mm/aaaa). */
export function formatDate(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR');
}

/** Saludo según la hora del día. */
export function saludoHorario(hora = new Date().getHours()): string {
  if (hora < 12) return 'Buen día';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Devuelve un color hex y un label legible para una materia. */
const PALETA_MATERIAS = [
  { bg: '#1e3a8a', text: '#fff', accent: '#1e40af' }, // azul
  { bg: '#15803d', text: '#fff', accent: '#16a34a' }, // verde
  { bg: '#7c3aed', text: '#fff', accent: '#8b5cf6' }, // violeta
  { bg: '#b91c1c', text: '#fff', accent: '#dc2626' }, // rojo
  { bg: '#b45309', text: '#fff', accent: '#d97706' }, // ámbar
  { bg: '#0f766e', text: '#fff', accent: '#14b8a6' }, // teal
  { bg: '#9d174d', text: '#fff', accent: '#db2777' }, // rosa
] as const;

/**
 * Devuelve un color determinístico para una materia en base a su id/código.
 * Permite que las cards mantengan colores consistentes en todas las pantallas.
 */
export function colorMateria(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETA_MATERIAS[hash % PALETA_MATERIAS.length];
}
