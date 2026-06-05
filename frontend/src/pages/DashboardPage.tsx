import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { alumnosApi } from '../api/alumnos.api';
import { inscripcionesApi } from '../api/inscripciones.api';
import { constanciasApi } from '../api/constancias.api';
import { usuariosApi } from '../api/usuarios.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FullPageLoader, Spinner } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { HeroSaludo } from './dashboard/HeroSaludo';
import { MateriaCard } from './dashboard/MateriaCard';
import { PanelCuatrimestre } from './dashboard/PanelCuatrimestre';
import { PanelAcciones, type AccionRequerida } from './dashboard/PanelAcciones';

export function DashboardPage() {
  const { usuario } = useAuth();
  const isAlumno = usuario?.rol === 'ALUMNO';
  const isDocente = usuario?.rol === 'DOCENTE';

  const alumno = useApi(
    () => (isAlumno ? alumnosApi.me() : Promise.resolve(null)),
    [isAlumno],
  );
  const inscripciones = useApi(
    () =>
      isAlumno
        ? inscripcionesApi.list({ cicloLectivo: new Date().getFullYear(), pageSize: 50 })
        : Promise.resolve(null),
    [isAlumno],
  );
  const constancias = useApi(
    () => (!isDocente ? constanciasApi.list({ pageSize: 5 }) : Promise.resolve(null)),
    [isDocente],
  );
  const misMaterias = useApi(
    () => (isDocente && usuario ? usuariosApi.getMaterias(usuario.id) : Promise.resolve(null)),
    [isDocente, usuario?.id],
  );

  const acciones = useMemo<AccionRequerida[]>(() => {
    if (!isAlumno) return [];
    const out: AccionRequerida[] = [];
    const pendientes = inscripciones.data?.items.filter((i) => i.estado === 'PENDIENTE') ?? [];
    pendientes.forEach((i) => {
      out.push({
        tono: 'warn',
        titulo: 'Confirmá tu inscripción',
        descripcion: `${i.materia?.nombre ?? 'Materia'} — pendiente de confirmación.`,
        ctaLabel: 'Confirmar',
        ctaHref: '/inscripciones',
      });
    });
    const constanciasEmitidas = constancias.data?.items.filter((c) => c.estado === 'EMITIDA') ?? [];
    constanciasEmitidas.slice(0, 1).forEach((c) => {
      out.push({
        tono: 'info',
        titulo: 'Constancia lista',
        descripcion: `Código ${c.codigoVerificacion} — disponible para descarga.`,
        ctaLabel: 'Descargar PDF',
        ctaHref: '/constancias',
      });
    });
    return out;
  }, [inscripciones.data, constancias.data, isAlumno]);

  // ── Dashboard para docente ────────────────────────────────────────────────
  if (isDocente) {
    if (misMaterias.loading) return <FullPageLoader />;
    const materias: any[] = misMaterias.data ?? [];
    return (
      <div className="max-w-screen-2xl mx-auto">
        <p className="text-xs text-slate-500 mb-2">SIGA / Inicio</p>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Bienvenido, {usuario?.nombre} {usuario?.apellido}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Docente · {new Date().getFullYear()}</p>
        </div>

        {materias.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <GraduationCap size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-700">Todavía no tenés materias asignadas</p>
              <p className="text-sm text-slate-500 mt-1">
                Contactá al administrador para que te asigne tus materias.
              </p>
            </div>
          </Card>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">
              Tus materias este ciclo ({materias.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {materias.map((dm: any) => (
                <Card key={dm.materiaId}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-xs font-semibold text-navy-700 shrink-0">
                      {dm.materia.codigo.slice(-3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{dm.materia.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {dm.materia.codigo} · {dm.materia.anio}° año · {dm.materia.cuatrimestre}° cuatr.
                      </p>
                      <Badge tone="neutral" className="mt-2 text-xs">
                        {dm.materia.carrera.split(' ').slice(-1)[0]}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Link
                      to="/mis-materias"
                      className="text-sm text-navy-700 hover:underline flex items-center gap-1"
                    >
                      Ver alumnos y calificar <ArrowRight size={13} />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard para staff / admin ──────────────────────────────────────────
  if (!isAlumno) {
    if (constancias.loading) return <FullPageLoader />;
    return (
      <div className="max-w-screen-2xl mx-auto">
        <p className="text-xs text-slate-500 mb-2">SIGA / Inicio</p>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Bienvenido, {usuario?.nombre} {usuario?.apellido}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Rol: {usuario?.rol} · Sistema Integral de Gestión Académica
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-1">Alumnos</h3>
            <p className="text-sm text-slate-500 mb-3">
              Gestión de legajos y datos académicos
            </p>
            <Link
              to="/legajo"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver sección <ArrowRight size={14} />
            </Link>
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-900 mb-1">Materias</h3>
            <p className="text-sm text-slate-500 mb-3">
              Catálogo, correlatividades y cupos
            </p>
            <Link
              to="/materias"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver materias <ArrowRight size={14} />
            </Link>
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-900 mb-1">Constancias</h3>
            <p className="text-sm text-slate-500 mb-3">
              Solicitudes y emisión de constancias
            </p>
            <Link
              to="/constancias"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver constancias <ArrowRight size={14} />
            </Link>
          </Card>
        </div>

        {constancias.data && constancias.data.items.length > 0 && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Constancias recientes</h3>
            <ul className="divide-y divide-slate-100">
              {constancias.data.items.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between text-sm">
                  <span className="text-slate-900">
                    {c.tipo.replace(/_/g, ' ')} —{' '}
                    {c.alumno ? `${c.alumno.apellido}, ${c.alumno.nombre}` : '—'}
                  </span>
                  <span className="text-xs text-slate-500">{c.estado}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  // ── Dashboard para alumnos ────────────────────────────────────────────────
  if (alumno.loading || inscripciones.loading) return <FullPageLoader />;
  if (alumno.error) return <ErrorAlert message={alumno.error} />;
  if (!alumno.data || !usuario) return null;

  const carrera = alumno.data.carrera;
  const cursadas =
    inscripciones.data?.items.filter((i) => i.tipo === 'CURSADA' && i.estado !== 'CANCELADA') ??
    [];

  return (
    <div className="max-w-screen-2xl mx-auto">
      <p className="text-xs text-slate-500 mb-2">SIGA / Inicio</p>

      <HeroSaludo
        nombre={usuario.nombre}
        carrera={carrera}
        proximaClase={
          cursadas[0]
            ? {
                materia: cursadas[0].materia?.nombre ?? 'Próxima materia',
                horario: '18:00 – 21:00',
                aula: 'Aula 12',
                docente: 'Prof. asignado',
                enHoras: '4 h 12 m',
              }
            : undefined
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-6">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Mi cursada</h3>
                <p className="text-xs text-slate-500">
                  {cursadas.length}{' '}
                  {cursadas.length === 1 ? 'materia inscripta' : 'materias inscriptas'}
                  {' · '}
                  {new Date().getMonth() < 6 ? '1°' : '2°'} cuatr.{' '}
                  {new Date().getFullYear()}
                </p>
              </div>
              <Link to="/legajo" className="btn-ghost text-sm">
                Ver legajo <ArrowRight size={14} />
              </Link>
            </div>

            {cursadas.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No tenés materias inscriptas este cuatrimestre.{' '}
                <Link to="/inscripciones" className="text-navy-700 hover:underline">
                  Inscribite ahora →
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cursadas.map((i) => (
                  <MateriaCard
                    key={i.id}
                    codigo={i.materia?.codigo ?? '—'}
                    nombre={i.materia?.nombre ?? 'Materia'}
                    comision="A"
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-slate-900 mb-2">Próximos finales</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mesas de examen disponibles e inscripciones activas
            </p>
            <ListaMesas />
          </Card>
        </div>

        <aside className="space-y-6">
          <PanelCuatrimestre
            asistencia={87}
            clasesAsistidas={54}
            clasesTotales={62}
            asistenciaMinima={75}
            presentes={54}
            justificadas={4}
            sinJustificar={4}
            promedio={8.4}
            esRegular={true}
          />
          <PanelAcciones acciones={acciones} />
        </aside>
      </div>
    </div>
  );
}

function ListaMesas() {
  const mesas = useApi(
    () =>
      inscripcionesApi.list({
        tipo: 'MESA_EXAMEN',
        pageSize: 5,
      }),
    [],
  );

  if (mesas.loading) return <Spinner />;
  if (!mesas.data?.items.length) {
    return (
      <p className="text-sm text-slate-500 italic">No hay mesas registradas todavía.</p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {mesas.data.items.map((m) => (
        <li key={m.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="text-center w-10">
              <p className="text-[10px] uppercase text-slate-400">
                {m.fechaExamen
                  ? new Date(m.fechaExamen).toLocaleDateString('es-AR', { month: 'short' })
                  : '—'}
              </p>
              <p className="font-serif text-base font-semibold text-slate-900">
                {m.fechaExamen ? new Date(m.fechaExamen).getDate() : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {m.materia?.nombre ?? '—'}
              </p>
              <p className="text-xs text-slate-500">
                {m.observaciones ?? 'Mesa de examen final'}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500">{m.estado}</span>
        </li>
      ))}
    </ul>
  );
}
