import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { alumnosApi } from '../api/alumnos.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FullPageLoader } from '../components/ui/Spinner';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { formatDate, getIniciales } from '../utils/format';

export function PerfilPage() {
  const { usuario } = useAuth();
  const alumno = useApi(
    () => (usuario?.rol === 'ALUMNO' ? alumnosApi.me() : Promise.resolve(null)),
    [usuario?.id],
  );

  if (!usuario || alumno.loading) return <FullPageLoader />;

  return (
    <div className="max-w-screen-lg mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Mi perfil' }]} />

      <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-6">Mi perfil</h1>

      <Card>
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-navy-900 text-white flex items-center justify-center text-lg font-semibold">
            {getIniciales(usuario.nombre, usuario.apellido)}
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-slate-900">
              {usuario.nombre} {usuario.apellido}
            </h2>
            <p className="text-sm text-slate-500">{usuario.email}</p>
            <div className="mt-2">
              <Badge tone="navy">{usuario.rol}</Badge>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Dato label="Email" valor={usuario.email} />
          <Dato label="Rol institucional" valor={usuario.rol} />
          {alumno.data && (
            <>
              <Dato label="Legajo" valor={alumno.data.legajo} />
              <Dato label="DNI" valor={alumno.data.dni} />
              <Dato label="Carrera" valor={alumno.data.carrera} />
              <Dato label="Año de ingreso" valor={String(alumno.data.anioIngreso)} />
              <Dato label="Teléfono" valor={alumno.data.telefono ?? '—'} />
              <Dato label="Dirección" valor={alumno.data.direccion ?? '—'} />
              <Dato label="Fecha de nacimiento" valor={formatDate(alumno.data.fechaNacimiento)} />
              <Dato label="Estado" valor={<Badge tone="success">{alumno.data.estado}</Badge>} />
            </>
          )}
        </dl>
      </Card>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{label}</dt>
      <dd className="text-sm text-slate-900 mt-0.5">{valor}</dd>
    </div>
  );
}
