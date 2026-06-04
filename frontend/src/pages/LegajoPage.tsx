import { useState } from 'react';
import { Search } from 'lucide-react';
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
import type { Alumno, EstadoCursada } from '../types';

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
      <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">Legajo académico</h1>
      <p className="text-sm text-slate-500 mb-6">Información personal y trayectoria académica</p>
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
  historial: Array<{
    id: string; cicloLectivo: number; tipo: string;
    estadoCursada: EstadoCursada | null; nota: number | null;
    fechaInscripcion: string;
    materia?: { nombre?: string; codigo?: string } | null;
  }>;
}) {
  return (
    <>
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
          <h3 className="font-semibold text-slate-900 mb-4">Estadísticas</h3>
          <ul className="space-y-3">
            <StatRow label="Total de materias" valor={estadisticas.totalMaterias} />
            <StatRow label="Aprobadas" valor={estadisticas.aprobadas} tono="success" />
            <StatRow label="Regulares" valor={estadisticas.regulares} tono="info" />
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Historial académico</h3>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            El historial está vacío.
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
                {historial.map((i) => (
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

function StatRow({
  label, valor, tono = 'neutral',
}: {
  label: string; valor: number; tono?: 'success' | 'info' | 'neutral';
}) {
  const colores = { success: 'text-emerald-600', info: 'text-sky-600', neutral: 'text-slate-700' } as const;
  return (
    <li className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`font-serif text-xl font-semibold ${colores[tono]}`}>{valor}</span>
    </li>
  );
}

function EstadoCursadaChip({ estado }: { estado: EstadoCursada | null }) {
  if (!estado) return <span className="text-slate-400">—</span>;
  const map: Record<EstadoCursada, 'success' | 'info' | 'danger' | 'warn' | 'neutral'> = {
    APROBADA: 'success', REGULAR: 'info', EN_CURSO: 'warn', REPROBADA: 'danger', LIBRE: 'neutral',
  };
  return <Badge tone={map[estado]}>{estado}</Badge>;
}
