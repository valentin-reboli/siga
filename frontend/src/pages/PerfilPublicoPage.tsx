import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, BookOpen } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usuariosApi } from '../api/usuarios.api';
import { Card } from '../components/ui/Card';
import { FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { getIniciales } from '../utils/format';

export function PerfilPublicoPage() {
  const { id = '' } = useParams<{ id: string }>();

  const perfil = useApi(
    () => (id ? usuariosApi.getPerfilPublico(id) : Promise.resolve(null)),
    [id],
  );

  if (perfil.loading) return <FullPageLoader />;
  if (perfil.error) {
    return (
      <div className="max-w-screen-md mx-auto">
        <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Perfil docente' }]} />
        <ErrorAlert message={perfil.error} />
      </div>
    );
  }
  if (!perfil.data) return null;

  const { nombre, apellido, avatarUrl, materias } = perfil.data;
  const iniciales = getIniciales(nombre, apellido);

  return (
    <div className="max-w-screen-md mx-auto">
      <Breadcrumb
        items={[
          { label: 'SIGA', to: '/' },
          { label: 'Materias y foros', to: '/materias' },
          { label: `${apellido}, ${nombre}` },
        ]}
      />

      <Card className="mb-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${nombre} ${apellido}`}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-xl shrink-0">
              {iniciales}
            </div>
          )}

          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy-900">
              {apellido}, {nombre}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
              <GraduationCap size={14} />
              <span>Docente</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Materias a cargo */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <BookOpen size={15} className="text-slate-400" />
          Materias a cargo
        </h2>

        {materias.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 italic py-6 text-center">
              Sin materias asignadas actualmente.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {materias.map((dm) => (
              <Link
                key={dm.materiaId}
                to={`/materias/${dm.materia.id}`}
                className="block"
              >
                <Card className="flex items-center justify-between gap-4 hover:ring-1 hover:ring-navy-200 transition-all cursor-pointer py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0 ring-1 ring-teal-100">
                      {dm.materia.codigo.slice(-2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{dm.materia.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {dm.materia.codigo} · {dm.materia.anio}° año · {dm.materia.cuatrimestre}° cuatr. · {dm.materia.carrera}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-navy-600 font-medium shrink-0">Ver foro →</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
