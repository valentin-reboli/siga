import { Card } from '../../components/ui/Card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface AccionRequerida {
  /** Color del dot del lado izquierdo. */
  tono: 'danger' | 'warn' | 'info' | 'neutral';
  titulo: string;
  descripcion: string;
  ctaLabel: string;
  ctaHref: string;
}

interface Props {
  acciones: AccionRequerida[];
}

const dotColor: Record<AccionRequerida['tono'], string> = {
  danger: '#dc2626',
  warn: '#d97706',
  info: '#2563eb',
  neutral: '#64748b',
};

/**
 * Lista de acciones pendientes que el alumno tiene que resolver.
 */
export function PanelAcciones({ acciones }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900">Acciones requeridas</h3>
        <span className="text-xs text-slate-500">
          {acciones.length} {acciones.length === 1 ? 'pendiente' : 'pendientes'}
        </span>
      </div>

      {acciones.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No hay acciones pendientes.</p>
      ) : (
        <ul className="space-y-3">
          {acciones.map((a, i) => (
            <li key={i} className="border-t border-slate-100 first:border-t-0 pt-3 first:pt-0">
              <div className="flex items-start gap-2 mb-1">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor[a.tono] }}
                />
                <p className="text-sm font-semibold text-slate-900">{a.titulo}</p>
              </div>
              <p className="text-xs text-slate-500 ml-3.5 mb-1.5">{a.descripcion}</p>
              <Link
                to={a.ctaHref}
                className="text-xs font-semibold text-navy-700 hover:text-navy-900 inline-flex items-center gap-1 ml-3.5"
              >
                {a.ctaLabel} <ArrowRight size={12} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
