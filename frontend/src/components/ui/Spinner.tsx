import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-slate-500 ${className}`} />;
}

/** Pantalla completa con spinner centrado, para suspense / carga inicial. */
export function FullPageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3 py-16">
      <Spinner size={28} />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
