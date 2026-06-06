import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarClock, Megaphone } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { foroApi } from '../../api/foro.api';
import { Spinner } from '../ui/Spinner';
import { tiempoRelativo } from '../../utils/format';

const SEEN_KEY = 'siga_notif_seen';

/**
 * Campana de notificaciones: muestra próximos exámenes y novedades del foro de
 * las materias del usuario (reutiliza /foro/agenda). El punto rojo aparece sólo
 * si hay novedades posteriores a la última vez que se abrió el panel.
 */
export function NotificacionesMenu() {
  const agenda = useApi(() => foroApi.agenda(), []);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(() => Number(localStorage.getItem(SEEN_KEY) || 0));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const examenes = agenda.data?.examenes ?? [];
  const novedades = agenda.data?.novedades ?? [];
  const total = examenes.length + novedades.length;
  const nuevas = novedades.filter((n) => new Date(n.creadoEn).getTime() > lastSeen).length;
  const showDot = nuevas > 0;

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next) {
        const now = Date.now();
        setLastSeen(now);
        localStorage.setItem(SEEN_KEY, String(now));
      }
      return next;
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-700"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {showDot && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cruz" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
          </div>

          {agenda.loading ? (
            <div className="p-6">
              <Spinner className="mx-auto" />
            </div>
          ) : total === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No tenés notificaciones por ahora.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1">
              {examenes.length > 0 && (
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Próximos exámenes
                </p>
              )}
              {examenes.map((e) => (
                <Link
                  key={e.id}
                  to={`/materias/${e.materia.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                    <CalendarClock size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{e.titulo}</p>
                    <p className="truncate text-xs text-slate-400">
                      {e.materia.nombre} · {new Date(e.fechaExamen).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </Link>
              ))}

              {novedades.length > 0 && (
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Novedades del foro
                </p>
              )}
              {novedades.map((n) => (
                <Link
                  key={n.id}
                  to={`/materias/${n.materia.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
                    <Megaphone size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{n.titulo}</p>
                    <p className="truncate text-xs text-slate-400">
                      {n.materia.nombre} · {tiempoRelativo(n.creadoEn)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
