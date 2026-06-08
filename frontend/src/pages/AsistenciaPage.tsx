import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Save,
  ListChecks,
  UserCheck,
  CalendarDays,
  CheckCheck,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { materiasApi } from '../api/materias.api';
import { asistenciasApi } from '../api/asistencias.api';
import { extractErrorMessage } from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import type { EstadoAsistencia } from '../types';

// Fecha de hoy en formato YYYY-MM-DD según la zona horaria local.
function hoyLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

const ANIO_ACTUAL = new Date().getFullYear();
const CICLOS = [ANIO_ACTUAL + 1, ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2];

function nombreAlumno(a: { nombre: string; apellido: string }): string {
  return `${a.apellido}, ${a.nombre}`;
}

function iniciales(a: { nombre: string; apellido: string }): string {
  return `${a.apellido.charAt(0)}${a.nombre.charAt(0)}`.toUpperCase();
}

export function AsistenciaPage() {
  const { materiaId = '' } = useParams<{ materiaId: string }>();

  const [fecha, setFecha] = useState(hoyLocal());
  const [ciclo, setCiclo] = useState(ANIO_ACTUAL);
  const [modo, setModo] = useState<'tomar' | 'lista'>('tomar');
  const [idx, setIdx] = useState(0);
  const [estados, setEstados] = useState<Record<string, EstadoAsistencia | null>>({});
  const [guardando, setGuardando] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const materia = useApi(() => materiasApi.getById(materiaId), [materiaId]);
  const roster = useApi(
    () => asistenciasApi.roster(materiaId, ciclo, fecha),
    [materiaId, ciclo, fecha],
  );

  const items = useMemo(() => roster.data?.items ?? [], [roster.data]);

  // Al llegar (o cambiar) el roster, sincronizamos el estado local y reiniciamos.
  useEffect(() => {
    if (!roster.data) return;
    const init: Record<string, EstadoAsistencia | null> = {};
    for (const it of roster.data.items) init[it.inscripcionId] = it.estado;
    setEstados(init);
    setIdx(0);
    setOkMsg(null);
    setSaveError(null);
  }, [roster.data]);

  function marcar(inscripcionId: string, estado: EstadoAsistencia) {
    setEstados((prev) => ({ ...prev, [inscripcionId]: estado }));
    setOkMsg(null);
  }

  function marcarYAvanzar(estado: EstadoAsistencia) {
    const actual = items[idx];
    if (!actual) return;
    marcar(actual.inscripcionId, estado);
    setIdx((i) => Math.min(i + 1, items.length));
  }

  function marcarRestoPresentes() {
    setEstados((prev) => {
      const next = { ...prev };
      for (const it of items) if (!next[it.inscripcionId]) next[it.inscripcionId] = 'PRESENTE';
      return next;
    });
  }

  const conteo = useMemo(() => {
    let presentes = 0;
    let ausentes = 0;
    let justificadas = 0;
    let marcados = 0;
    for (const it of items) {
      const e = estados[it.inscripcionId];
      if (!e) continue;
      marcados += 1;
      if (e === 'PRESENTE') presentes += 1;
      else if (e === 'AUSENTE') ausentes += 1;
      else justificadas += 1;
    }
    return { presentes, ausentes, justificadas, marcados, total: items.length };
  }, [items, estados]);

  async function guardar() {
    const registros = items
      .filter((it) => estados[it.inscripcionId])
      .map((it) => ({ inscripcionId: it.inscripcionId, estado: estados[it.inscripcionId]! }));
    if (registros.length === 0) {
      setSaveError('Todavía no marcaste la asistencia de ningún alumno.');
      return;
    }
    setGuardando(true);
    setSaveError(null);
    setOkMsg(null);
    try {
      const res = await asistenciasApi.guardar(materiaId, {
        fecha,
        cicloLectivo: ciclo,
        registros,
      });
      setOkMsg(`✓ Asistencia guardada para ${res.guardados} alumno(s) — clase del ${fecha}.`);
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'No se pudo guardar la asistencia'));
    } finally {
      setGuardando(false);
    }
  }

  if (materia.loading) return <FullPageLoader />;

  const nombreMateria = materia.data?.nombre ?? 'Materia';

  return (
    <div className="max-w-screen-lg mx-auto">
      <Breadcrumb
        items={[
          { label: 'SIGA', to: '/' },
          { label: 'Mis materias', to: '/mis-materias' },
          { label: 'Asistencia' },
        ]}
      />

      <div className="mb-5">
        <h1 className="font-serif text-2xl font-semibold text-navy-900">Tomar asistencia</h1>
        <p className="text-sm text-slate-500">
          {nombreMateria}
          {materia.data ? ` · ${materia.data.codigo}` : ''}
        </p>
      </div>

      {/* Controles: fecha + ciclo + modo */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} /> Fecha de la clase
            </span>
            <input
              type="date"
              value={fecha}
              max={hoyLocal()}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-navy-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            <span>Ciclo lectivo</span>
            <select
              value={ciclo}
              onChange={(e) => setCiclo(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-navy-400 focus:outline-none"
            >
              {CICLOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setModo('tomar')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                modo === 'tomar' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <UserCheck size={14} /> Uno por uno
            </button>
            <button
              onClick={() => setModo('lista')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                modo === 'lista' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <ListChecks size={14} /> Lista completa
            </button>
          </div>
        </div>
      </Card>

      {okMsg && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {okMsg}
        </div>
      )}
      {saveError && (
        <div className="mb-4">
          <ErrorAlert message={saveError} />
        </div>
      )}

      {roster.loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : roster.error ? (
        <ErrorAlert message={roster.error} />
      ) : items.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              No hay alumnos en cursada para {ciclo} en esta materia.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Verificá el ciclo lectivo o las inscripciones de la materia.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Resumen vivo + guardar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="success">
              <Check size={12} /> {conteo.presentes} presentes
            </Badge>
            <Badge tone="danger">
              <X size={12} /> {conteo.ausentes} ausentes
            </Badge>
            {conteo.justificadas > 0 && (
              <Badge tone="warn">{conteo.justificadas} justificadas</Badge>
            )}
            <Badge tone="neutral">
              {conteo.marcados}/{conteo.total} marcados
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={marcarRestoPresentes}
                leftIcon={<CheckCheck size={15} />}
              >
                Resto presentes
              </Button>
              <Button onClick={guardar} disabled={guardando} leftIcon={<Save size={15} />}>
                {guardando ? 'Guardando…' : 'Guardar asistencia'}
              </Button>
            </div>
          </div>

          {modo === 'tomar' ? (
            <ModoTomar
              items={items}
              idx={idx}
              setIdx={setIdx}
              estados={estados}
              onMarcar={marcarYAvanzar}
            />
          ) : (
            <ModoLista items={items} estados={estados} onMarcar={marcar} />
          )}
        </>
      )}
    </div>
  );
}

// ── Modo "uno por uno" ─────────────────────────────────────────────────────────

interface RosterItem {
  inscripcionId: string;
  alumno: { id: string; legajo: string; nombre: string; apellido: string };
  estado: EstadoAsistencia | null;
}

function ModoTomar({
  items,
  idx,
  setIdx,
  estados,
  onMarcar,
}: {
  items: RosterItem[];
  idx: number;
  setIdx: (fn: (i: number) => number) => void;
  estados: Record<string, EstadoAsistencia | null>;
  onMarcar: (estado: EstadoAsistencia) => void;
}) {
  const terminado = idx >= items.length;
  const actual = items[idx];
  const progreso = Math.round((Math.min(idx, items.length) / items.length) * 100);

  return (
    <Card padding="lg">
      {/* Barra de progreso */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>
            {terminado ? 'Listado completo' : `Alumno ${idx + 1} de ${items.length}`}
          </span>
          <span>{progreso}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {!terminado && actual ? (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-lg font-bold text-navy-700 ring-1 ring-navy-100">
            {iniciales(actual.alumno)}
          </div>
          <p className="font-serif text-xl font-semibold text-navy-900">
            {nombreAlumno(actual.alumno)}
          </p>
          <p className="mb-6 text-xs text-slate-500">Legajo {actual.alumno.legajo}</p>

          {estados[actual.inscripcionId] && (
            <p className="mb-3 text-xs text-slate-400">
              Ya marcado como{' '}
              <span className="font-semibold">{estados[actual.inscripcionId]}</span> · podés
              cambiarlo
            </p>
          )}

          <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onMarcar('PRESENTE')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-5 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Check size={22} /> Presente
            </button>
            <button
              onClick={() => onMarcar('AUSENTE')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-5 text-base font-semibold text-white transition-colors hover:bg-red-700"
            >
              <X size={22} /> Ausente
            </button>
          </div>

          <button
            onClick={() => onMarcar('JUSTIFICADO')}
            className="mt-3 text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline"
          >
            Marcar como ausencia justificada
          </button>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="flex items-center gap-1 text-slate-500 hover:text-navy-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(items.length, i + 1))}
              className="flex items-center gap-1 text-slate-500 hover:text-navy-700"
            >
              Saltear <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCheck size={28} />
          </div>
          <p className="font-semibold text-navy-900">Pasaste lista a todos los alumnos.</p>
          <p className="mt-1 text-xs text-slate-500">
            Revisá el resumen de arriba y tocá <span className="font-semibold">Guardar
            asistencia</span>.
          </p>
          <button
            onClick={() => setIdx(() => 0)}
            className="mt-4 text-sm font-medium text-navy-700 hover:underline"
          >
            Volver al inicio del listado
          </button>
        </div>
      )}
    </Card>
  );
}

// ── Modo "lista completa" ───────────────────────────────────────────────────────

function ModoLista({
  items,
  estados,
  onMarcar,
}: {
  items: RosterItem[];
  estados: Record<string, EstadoAsistencia | null>;
  onMarcar: (inscripcionId: string, estado: EstadoAsistencia) => void;
}) {
  return (
    <Card padding="none">
      <ul className="divide-y divide-slate-100">
        {items.map((it) => {
          const e = estados[it.inscripcionId];
          return (
            <li
              key={it.inscripcionId}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                {iniciales(it.alumno)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {nombreAlumno(it.alumno)}
                </p>
                <p className="text-xs text-slate-400">Legajo {it.alumno.legajo}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onMarcar(it.inscripcionId, 'PRESENTE')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    e === 'PRESENTE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Check size={13} /> P
                </button>
                <button
                  onClick={() => onMarcar(it.inscripcionId, 'AUSENTE')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    e === 'AUSENTE'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <X size={13} /> A
                </button>
                <button
                  onClick={() => onMarcar(it.inscripcionId, 'JUSTIFICADO')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    e === 'JUSTIFICADO'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  J
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
