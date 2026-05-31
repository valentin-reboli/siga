import { useApi } from '../hooks/useApi';
import { alumnosApi } from '../api/alumnos.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { formatDate } from '../utils/format';
import type { EstadoCursada } from '../types';

/**
 * Vista de legajo digital del alumno: datos personales + historial académico
 * + estadísticas. El alumno solo puede ver el suyo (el backend valida).
 */
export function LegajoPage() {
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

      <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">
        Legajo académico
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Información personal y trayectoria académica
      </p>

      {/* Datos personales */}
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
              valor={<Badge tone={alumno.estado === 'ACTIVO' ? 'success' : 'neutral'}>{alumno.estado}</Badge>}
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

      {/* Historial */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Historial académico</h3>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            Tu historial está vacío. Inscribite a tus primeras materias.
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
    </div>
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
  label,
  valor,
  tono = 'neutral',
}: {
  label: string;
  valor: number;
  tono?: 'success' | 'info' | 'neutral';
}) {
  const colores = {
    success: 'text-emerald-600',
    info: 'text-sky-600',
    neutral: 'text-slate-700',
  } as const;
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
    APROBADA: 'success',
    REGULAR: 'info',
    EN_CURSO: 'warn',
    REPROBADA: 'danger',
    LIBRE: 'neutral',
  };
  return <Badge tone={map[estado]}>{estado}</Badge>;
}
