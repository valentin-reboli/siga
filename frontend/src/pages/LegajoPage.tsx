import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, ChevronRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { alumnosApi } from '../api/alumnos.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { FullPageLoader, Spinner } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { formatDate } from '../utils/format';
import type { Alumno, EstadoCursada, Inscripcion } from '../types';

export function LegajoPage() {
  const { usuario } = useAuth();
  const isAlumno = usuario?.rol === 'ALUMNO';

  if (!isAlumno) return <LegajoAdmin />;
  return <LegajoPropio />;
}

// ── Vista alumno: su propio legajo ────────────────────────────────────────────

function LegajoPropio() {
  const me = useApi(() => alumnosApi.me(), []);
  const legajo = useApi(
    () => (me.data ? alumnosApi.getLegajo(me.data.id) : Promise.reject('Sin alumno')),
    [me.data?.id],
  );

  if (me.loading || legajo.loading) return <FullPageLoader />;
  if (me.error) return <ErrorAlert message={me.error} />;
  if (legajo.error) return <ErrorAlert message={legajo.error} />;
  if (!legajo.data) return null;

  const { alumno, estadisticas, historial } = legajo.data;

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Mi legajo académico' }]} />
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">Legajo académico</h1>
          <p className="text-sm text-slate-500">Información personal y trayectoria académica</p>
        </div>
        <Link
          to="/plan"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <LayoutGrid size={15} />
          Ver plan de estudios
          <ChevronRight size={14} className="text-slate-400" />
        </Link>
      </div>
      <LegajoDetalle alumno={alumno} estadisticas={estadisticas} historial={historial} />
    </div>
  );
}

// ── Vista admin: buscar alumno y ver su legajo ────────────────────────────────

function LegajoAdmin() {
  const [q, setQ] = useState('');
  const [seleccionado, setSeleccionado] = useState<Alumno | null>(null);

  const alumnos = useApi(
    () => alumnosApi.list({ q: q || undefined, pageSize: 20 }),
    [q],
  );

  const legajo = useApi(
    () => (seleccionado ? alumnosApi.getLegajo(seleccionado.id) : Promise.resolve(null)),
    [seleccionado?.id],
  );

  if (seleccionado && legajo.data) {
    const { alumno, estadisticas, historial } = legajo.data;
    return (
      <div className="max-w-screen-xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'SIGA', to: '/' },
            { label: 'Legajos', to: '/legajo' },
            { label: `${alumno.apellido}, ${alumno.nombre}` },
          ]}
        />
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSeleccionado(null)}
            className="text-sm text-slate-500 hover:text-slate-900 underline"
          >
            ← Volver a la búsqueda
          </button>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">
          {alumno.apellido}, {alumno.nombre}
        </h1>
        <p className="text-sm text-slate-500 mb-6">Legajo {alumno.legajo} · {alumno.carrera}</p>
        <LegajoDetalle alumno={alumno} estadisticas={estadisticas} historial={historial} />
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Legajos' }]} />
      <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">Legajos</h1>
      <p className="text-sm text-slate-500 mb-6">Buscá un alumno para ver su legajo académico</p>

      <Card>
        <div className="mb-4">
          <Input
            placeholder="Buscar por nombre, apellido o legajo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>

        {alumnos.loading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : alumnos.error ? (
          <ErrorAlert message={alumnos.error} />
        ) : !alumnos.data?.items.length ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            {q ? 'No se encontraron alumnos.' : 'Escribí para buscar alumnos.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alumnos.data.items.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setSeleccionado(a)}
                  className="w-full flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg text-left"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {a.apellido}, {a.nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      Legajo {a.legajo} · {a.carrera}
                    </p>
                  </div>
                  <Badge tone={a.estado === 'ACTIVO' ? 'success' : 'neutral'}>{a.estado}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {seleccionado && legajo.loading && (
        <div className="mt-4 flex justify-center"><Spinner /></div>
      )}
    </div>
  );
}

// ── Componente compartido de detalle ──────────────────────────────────────────

function LegajoDetalle({
  alumno,
  estadisticas,
  historial,
}: {
  alumno: {
    legajo: string; dni: string; nombre: string; apellido: string;
    carrera: string; anioIngreso: number; estado: string;
  };
  estadisticas: { totalMaterias: number; aprobadas: number; regulares: number };
  historial: Inscripcion[];
}) {
  // ── Filtros del historial ────────────────────────────────────────────────
  const [q, setQ] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoCursada | ''>('');
  const [filterCiclo, setFilterCiclo] = useState<number | ''>('');

  // ── Stats adicionales desde el historial ────────────────────────────────
  const statsExtras = useMemo(() => {
    // Por cada materia, quedarse con el estado más reciente (solo CURSADA)
    const porMateria = new Map<string, { ciclo: number; estado: EstadoCursada | null }>();
    for (const h of historial) {
      if (h.tipo !== 'CURSADA') continue;
      const prev = porMateria.get(h.materiaId);
      if (!prev || h.cicloLectivo > prev.ciclo) {
        porMateria.set(h.materiaId, { ciclo: h.cicloLectivo, estado: h.estadoCursada });
      }
    }
    let reprobadas = 0;
    let libres = 0;
    for (const { estado } of porMateria.values()) {
      if (estado === 'REPROBADA') reprobadas++;
      else if (estado === 'LIBRE') libres++;
    }
    return { reprobadas, libres };
  }, [historial]);

  // ── Ciclos disponibles (para el filtro) ─────────────────────────────────
  const ciclosDisponibles = useMemo(() => {
    const s = new Set<number>();
    for (const h of historial) s.add(h.cicloLectivo);
    return [...s].sort((a, b) => b - a);
  }, [historial]);

  // ── Historial filtrado ───────────────────────────────────────────────────
  const historialFiltrado = useMemo(() => {
    const term = q.trim().toLowerCase();
    return historial.filter((h) => {
      if (term && !h.materia?.nombre?.toLowerCase().includes(term) && !h.materia?.codigo?.toLowerCase().includes(term)) return false;
      if (filterEstado && h.estadoCursada !== filterEstado) return false;
      if (filterCiclo !== '' && h.cicloLectivo !== filterCiclo) return false;
      return true;
    });
  }, [historial, q, filterEstado, filterCiclo]);

  const progreso = estadisticas.totalMaterias > 0
    ? Math.round((estadisticas.aprobadas / estadisticas.totalMaterias) * 100)
    : 0;

  return (
    <>
      {/* ── Fila superior: datos personales + estadísticas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Datos personales</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <DatoLegajo label="Legajo" valor={alumno.legajo} />
            <DatoLegajo label="DNI" valor={alumno.dni} />
            <DatoLegajo label="Apellido y nombre" valor={`${alumno.apellido}, ${alumno.nombre}`} />
            <DatoLegajo label="Carrera" valor={alumno.carrera} />
            <DatoLegajo label="Año de ingreso" valor={String(alumno.anioIngreso)} />
            <DatoLegajo
              label="Estado"
              valor={
                <Badge tone={alumno.estado === 'ACTIVO' ? 'success' : 'neutral'}>
                  {alumno.estado}
                </Badge>
              }
            />
          </dl>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Avance de carrera</h3>

          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{estadisticas.aprobadas} de {estadisticas.totalMaterias} materias aprobadas</span>
              <span className="font-semibold text-emerald-600">{progreso}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          {/* Grid de stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatChip
              label="Aprobadas"
              valor={estadisticas.aprobadas}
              bg="bg-emerald-50"
              text="text-emerald-700"
            />
            <StatChip
              label="Regulares"
              valor={estadisticas.regulares}
              bg="bg-blue-50"
              text="text-blue-700"
            />
            <StatChip
              label="Reprobadas"
              valor={statsExtras.reprobadas}
              bg="bg-red-50"
              text="text-red-700"
            />
            <StatChip
              label="Libre"
              valor={statsExtras.libres}
              bg="bg-slate-100"
              text="text-slate-600"
            />
          </div>
        </Card>
      </div>

      {/* ── Historial académico con filtros ── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-slate-900">Historial académico</h3>
          <span className="text-xs text-slate-400">
            {historialFiltrado.length === historial.length
              ? `${historial.length} registros`
              : `${historialFiltrado.length} de ${historial.length}`}
          </span>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar materia…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leftIcon={<Search size={14} />}
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as EstadoCursada | '')}
            className="form-input sm:max-w-[160px]"
          >
            <option value="">Todo estado</option>
            <option value="APROBADA">Aprobada</option>
            <option value="REGULAR">Regular</option>
            <option value="EN_CURSO">En curso</option>
            <option value="REPROBADA">Reprobada</option>
            <option value="LIBRE">Libre</option>
          </select>
          <select
            value={filterCiclo}
            onChange={(e) => setFilterCiclo(e.target.value ? Number(e.target.value) : '')}
            className="form-input sm:max-w-[120px]"
          >
            <option value="">Todo ciclo</option>
            {ciclosDisponibles.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(q || filterEstado || filterCiclo !== '') && (
            <button
              onClick={() => { setQ(''); setFilterEstado(''); setFilterCiclo(''); }}
              className="text-xs text-slate-500 hover:text-slate-900 whitespace-nowrap px-2"
            >
              Limpiar
            </button>
          )}
        </div>

        {historial.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            El historial está vacío.
          </p>
        ) : historialFiltrado.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            No hay registros que coincidan con los filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left py-2 px-2 font-medium">Ciclo</th>
                  <th className="text-left py-2 px-2 font-medium">Materia</th>
                  <th className="text-left py-2 px-2 font-medium">Tipo</th>
                  <th className="text-left py-2 px-2 font-medium">Cursada</th>
                  <th className="text-left py-2 px-2 font-medium">Nota</th>
                  <th className="text-left py-2 px-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historialFiltrado.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2 text-slate-700">{i.cicloLectivo}</td>
                    <td className="py-3 px-2">
                      <p className="font-medium text-slate-900">{i.materia?.nombre}</p>
                      <p className="text-xs text-slate-500">{i.materia?.codigo}</p>
                    </td>
                    <td className="py-3 px-2 text-slate-700">
                      {i.tipo === 'CURSADA' ? 'Cursada' : 'Mesa'}
                    </td>
                    <td className="py-3 px-2">
                      <EstadoCursadaChip estado={i.estadoCursada} />
                    </td>
                    <td className="py-3 px-2 font-medium text-slate-900">{i.nota ?? '—'}</td>
                    <td className="py-3 px-2 text-slate-500">{formatDate(i.fechaInscripcion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function DatoLegajo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{label}</dt>
      <dd className="text-sm text-slate-900 mt-0.5">{valor}</dd>
    </div>
  );
}

function StatChip({
  label, valor, bg, text,
}: {
  label: string; valor: number; bg: string; text: string;
}) {
  return (
    <div className={`rounded-lg px-3 py-2.5 ${bg}`}>
      <p className={`text-xl font-serif font-semibold ${text}`}>{valor}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function EstadoCursadaChip({ estado }: { estado: EstadoCursada | null }) {
  if (!estado) return <span className="text-slate-400">—</span>;
  const map: Record<EstadoCursada, 'success' | 'info' | 'danger' | 'warn' | 'neutral'> = {
    APROBADA: 'success', REGULAR: 'info', EN_CURSO: 'warn', REPROBADA: 'danger', LIBRE: 'neutral',
  };
  return <Badge tone={map[estado]}>{estado}</Badge>;
}
