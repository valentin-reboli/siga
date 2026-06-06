import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarClock, GraduationCap, CalendarDays } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { calendarioApi } from '../api/calendario.api';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import type { EventoCalendario, TipoEvento } from '../types';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const META: Record<
  TipoEvento,
  { label: string; chip: string; dot: string; icon: typeof CalendarClock }
> = {
  EXAMEN: { label: 'Examen', chip: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: CalendarClock },
  MESA: { label: 'Mesa de examen', chip: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', icon: GraduationCap },
};

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (iso: string) => iso.slice(0, 10); // 'YYYY-MM-DD' (UTC)
const keyDate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function hoyKeyUTC(): string {
  const n = new Date();
  return keyDate(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}

export function CalendarioPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth()); // 0-11
  const [selectedKey, setSelectedKey] = useState<string>(hoyKeyUTC());

  // Primer día visible (lunes) y rango total de la grilla (6 semanas).
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // 0 = lunes
  const cells = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => new Date(Date.UTC(year, month, 1 - startWeekday + i))),
    [year, month, startWeekday],
  );

  const desde = cells[0];
  const hasta = new Date(cells[41].getTime() + (24 * 3600 - 1) * 1000);

  const eventos = useApi(
    () => calendarioApi.list({ desde: desde.toISOString(), hasta: hasta.toISOString() }),
    [year, month],
  );

  // Eventos agrupados por día.
  const porDia = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    for (const e of eventos.data ?? []) {
      const k = keyOf(e.fecha);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [eventos.data]);

  const hoy = hoyKeyUTC();
  const monthLabel = firstOfMonth.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const seleccionados = porDia.get(selectedKey) ?? [];

  function irMes(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  function irHoy() {
    setYear(now.getUTCFullYear());
    setMonth(now.getUTCMonth());
    setSelectedKey(hoyKeyUTC());
  }

  return (
    <div className="mx-auto max-w-screen-xl">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Calendario académico' }]} />

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Calendario académico</h1>
          <p className="text-sm text-slate-500">Exámenes y mesas de tus materias</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(META) as TipoEvento[]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${META[t].dot}`} /> {META[t].label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_20rem]">
        {/* Calendario */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="font-serif text-lg font-semibold capitalize text-navy-900">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => irMes(-1)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Mes anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={irHoy}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-slate-100"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => irMes(1)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Mes siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {eventos.error ? (
            <div className="p-5">
              <ErrorAlert message={eventos.error} />
            </div>
          ) : (
            <div className="relative">
              {eventos.loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                  <Spinner />
                </div>
              )}

              {/* Encabezado de días */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
                {DIAS.map((d) => (
                  <div
                    key={d}
                    className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Celdas */}
              <div className="grid grid-cols-7">
                {cells.map((d, i) => {
                  const y = d.getUTCFullYear();
                  const m = d.getUTCMonth();
                  const day = d.getUTCDate();
                  const k = keyDate(y, m, day);
                  const inMonth = m === month;
                  const isHoy = k === hoy;
                  const isSel = k === selectedKey;
                  const evs = porDia.get(k) ?? [];

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedKey(k)}
                      className={`min-h-[92px] border-b border-r border-slate-100 p-1.5 text-left align-top transition-colors ${
                        inMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40'
                      } ${isSel ? 'ring-2 ring-inset ring-navy-500' : ''}`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          isHoy
                            ? 'bg-navy-900 text-white'
                            : inMonth
                              ? 'text-slate-700'
                              : 'text-slate-300'
                        }`}
                      >
                        {day}
                      </span>

                      <div className="mt-1 space-y-1">
                        {evs.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${META[e.tipo].chip}`}
                            title={e.titulo}
                          >
                            {e.titulo}
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <div className="px-1 text-[10px] font-medium text-slate-400">
                            +{evs.length - 3} más
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Panel del día seleccionado */}
        <aside>
          <Card>
            <h3 className="font-serif text-lg font-semibold text-navy-900">
              {formatDiaLargo(selectedKey)}
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              {seleccionados.length === 0
                ? 'Sin eventos'
                : `${seleccionados.length} ${seleccionados.length === 1 ? 'evento' : 'eventos'}`}
            </p>

            {seleccionados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <CalendarDays size={26} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">No hay actividades este día.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {seleccionados.map((e) => {
                  const meta = META[e.tipo];
                  const Icon = meta.icon;
                  const to =
                    e.tipo === 'EXAMEN' && e.materia ? `/materias/${e.materia.id}` : '/inscripciones';
                  return (
                    <li key={e.id}>
                      <Link
                        to={to}
                        className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}
                        >
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{e.titulo}</p>
                          <p className="truncate text-xs text-slate-500">
                            {e.materia ? `${e.materia.codigo} · ` : ''}
                            {e.detalle ?? meta.label}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function formatDiaLargo(key: string): string {
  // key = 'YYYY-MM-DD' (UTC). Lo mostramos sin desfase de zona horaria.
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}
