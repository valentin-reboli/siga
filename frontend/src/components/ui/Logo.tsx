/**
 * Logo institucional ISCR (cruz roja sobre fondo blanco).
 * Componente SVG inline para no depender de assets externos.
 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="ISCR" role="img">
      <rect x="13" y="3" width="6" height="26" rx="1" fill="#dc2626" />
      <rect x="3" y="13" width="26" height="6" rx="1" fill="#dc2626" />
    </svg>
  );
}
