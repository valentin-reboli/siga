import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarClock, GraduationCap, CalendarDays, ClipboardList } from 'lucide-react';
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
  { label: string; descripcion: string; chip: string; dot: string; icon: typeof CalendarClock }
> = {
  EXAMEN: {
    label: 'Parcial / Evaluación',
    descripcion: 'Fechas de parciales y evaluaciones publicadas por el docente en el foro.',
    chip: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    icon: CalendarClock,
  },
  MESA: {
    label: 'Mesa de examen final',
    descripcion: 'Tus inscripciones a mesas de examen final.',
    chip: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
    icon: GraduationCap,
  },
};

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (iso: string) => iso.slice(0, 10);
const keyDate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function hoyKeyUTC(): string {
  const n = new Date();
  return keyDate(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}

export function CalendarioPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth());
  const [selectedKey, setSelectedKey] = useState<string>(hoyKeyUTC());

  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startWeekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const cells = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => new Date(Date.UTC(year, month, 1 - startWeekday + i))),
    [year, month, startWeekday],
  );

  const desde = cells[0];
  const hasta = new Date(cells[41].getTime() + (24 * 3600 - 1) * 1000);

  // Eventos del mes visible
  const eventos = useApi(
    () => calendarioApi.list({ desde: desde.toISOString(), hasta: hasta.toISOString() }),
    [year, month],
  );

  // Próximos 90 días (para el panel lateral)
  const proximosEventos = useApi(
    () => {
      const hoy = new Date();
      const en90dias = new Date(hoy.getTime() + 90 * 24 * 3600 * 1000);
      return calendarioApi.list({ desde: hoy.toISOString(), hasta: en90dias.toISOString() });
    },
    [],
  );

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

      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Calendario académico</h1>
          <p className="text-sm text-slate-500">Exámenes y mesas de tus materias</p>
        </div>
        {/* Leyenda con descripción */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {(Object.entries(META) as [TipoEvento, typeof META[TipoEvento]][]).map(([tipo, m]) => (
            <div key={tipo} className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
                {m.label}
              </span>
              <span className="pl-4 text-[11px] text-slate-400 leading-snug max-w-[220px]">
                {m.descripcion}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
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

              {/* Aviso si el mes actual no tiene eventos */}
              {!eventos.loading && (eventos.data ?? []).length === 0 && (
                <div className="border-t border-slate-100 px-6 py-4 text-center">
                  <p className="text-sm text-slate-400">
                    No hay eventos este mes. Navegá hacia adelante o{' '}
                    <Link to="/inscripciones" className="text-navy-700 hover:underline font-medium">
                      inscribite a una mesa
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Panel lateral */}
        <aside className="space-y-4">
          {/* Día seleccionado */}
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
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <CalendarDays size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">Sin actividades este día.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {seleccionados.map((e) => (
                  <EventoItem key={e.id} evento={e} />
                ))}
              </ul>
            )}
          </Card>

          {/* Próximos eventos — siguientes 90 días */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-semibold text-navy-900">Próximos eventos</h3>
              {proximosEventos.loading && <Spinner size={14} />}
            </div>

            {proximosEventos.error ? (
              <p className="text-xs text-slate-500 italic">{proximosEventos.error}</p>
            ) : !proximosEventos.loading && (proximosEventos.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <CalendarDays size={22} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">No tenés eventos en los próximos 90 días.</p>
                <Link
                  to="/inscripciones"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                >
                  <ClipboardList size={12} /> Inscribirme a una mesa
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {(proximosEventos.data ?? []).slice(0, 6).map((e) => {
                  const meta = META[e.tipo];
                  const [y, m, d] = keyOf(e.fecha).split('-').map(Number);
                  const fecha = new Date(Date.UTC(y, m - 1, d));
                  const esCercano =
                    (fecha.getTime() - Date.now()) / (1000 * 3600 * 24) <= 7;
                  return (
                    <li
                      key={e.id}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                    >
                      {/* Fecha compacta */}
                      <div className="w-9 shrink-0 text-center">
                        <p className="text-[10px] uppercase text-slate-400 leading-none">
                          {fecha.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' })}
                        </p>
                        <p className={`text-lg font-serif font-semibold leading-tight ${esCercano ? 'text-rose-600' : 'text-slate-800'}`}>
                          {d}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{e.titulo}</p>
                        <span className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.chip}`}>
                          {meta.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
                {(proximosEventos.data ?? []).length > 6 && (
                  <p className="text-center text-xs text-slate-400 pt-1">
                    y {(proximosEventos.data ?? []).length - 6} más en los próximos 90 días
                  </p>
                )}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function EventoItem({ evento }: { evento: EventoCalendario }) {
  const meta = META[evento.tipo];
  const Icon = meta.icon;
  const to =
    evento.tipo === 'EXAMEN' && evento.materia ? `/materias/${evento.materia.id}` : '/inscripciones';
  return (
    <li>
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
          <p className="truncate text-sm font-semibold text-slate-900">{evento.titulo}</p>
          <p className="truncate text-xs text-slate-500">
            {evento.materia ? `${evento.materia.codigo} · ` : ''}
            {evento.detalle ?? meta.label}
          </p>
        </div>
      </Link>
    </li>
  );
}

function formatDiaLargo(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}
