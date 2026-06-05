import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { AppModule } from '../../config/modules';

/**
 * Grilla de accesos rápidos: muestra TODAS las funciones disponibles para el
 * rol actual como tarjetas clickeables.
 */
export function AccesosRapidos({ modules }: { modules: AppModule[] }) {
  if (modules.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Accesos rápidos</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group siga-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${m.accentBg} ${m.accentFg}`}
            >
              <m.Icon size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-900">{m.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{m.description}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-navy-700 opacity-0 transition-opacity group-hover:opacity-100">
              Abrir <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
