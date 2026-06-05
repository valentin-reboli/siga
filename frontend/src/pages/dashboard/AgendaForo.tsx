import { Link } from 'react-router-dom';
import { CalendarClock, Bell, ArrowRight } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { foroApi } from '../../api/foro.api';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import type { TipoPublicacion } from '../../types';

const TIPO_LABEL: Record<TipoPublicacion, string> = {
  ANUNCIO: 'Anuncio',
  MATERIAL: 'Material',
  HILO: 'Discusión',
  EXAMEN: 'Examen',
};

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function fechaExamenLarga(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'long' });
}

/**
 * Panel del dashboard: próximos exámenes y novedades (tareas pendientes) del
 * foro de las materias del usuario.
 */
export function AgendaForo() {
  const agenda = useApi(() => foroApi.agenda(), []);

  if (agenda.loading) {
    return (
      <Card>
        <Spinner className="mx-auto" />
      </Card>
    );
  }
  if (agenda.error || !agenda.data) return null;

  const { examenes, novedades } = agenda.data;

  return (
    <div className="space-y-6">
      {/* Próximos exámenes */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock size={18} className="text-rose-600" />
          <h3 className="text-base font-semibold text-slate-900">Próximos exámenes</h3>
        </div>
        {examenes.length === 0 ? (
          <p className="text-sm italic text-slate-500">No tenés exámenes próximos.</p>
        ) : (
          <ul className="space-y-2">
            {examenes.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/materias/${e.materia.id}`}
                  className="flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 transition-colors hover:bg-rose-100/70"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-rose-700 shadow-sm">
                    <span className="text-[9px] font-semibold uppercase">
                      {new Date(e.fechaExamen).toLocaleDateString('es-AR', { month: 'short' })}
                    </span>
                    <span className="font-serif text-base font-bold leading-none">
                      {new Date(e.fechaExamen).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{e.titulo}</p>
                    <p className="truncate text-xs text-slate-500">
                      {e.materia.nombre} · <span className="capitalize">{fechaExamenLarga(e.fechaExamen)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Novedades del foro (tareas pendientes) */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Bell size={18} className="text-navy-700" />
          <h3 className="text-base font-semibold text-slate-900">Novedades del foro</h3>
        </div>
        {novedades.length === 0 ? (
          <p className="text-sm italic text-slate-500">No hay novedades en tus materias.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {novedades.map((n) => (
              <li key={n.id}>
                <Link
                  to={`/materias/${n.materia.id}`}
                  className="group flex items-start gap-3 py-2.5"
                >
                  <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                    {TIPO_LABEL[n.tipo]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 group-hover:text-navy-700">
                      {n.titulo}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {n.materia.nombre} · {fechaCorta(n.creadoEn)}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="mt-1 shrink-0 text-slate-300 transition-colors group-hover:text-navy-700"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
