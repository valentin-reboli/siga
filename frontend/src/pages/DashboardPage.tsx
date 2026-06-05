import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, MessageSquare, ClipboardCheck } from 'lucide-react';
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
import { CampusHero } from './dashboard/CampusHero';
import { AccesosRapidos } from './dashboard/AccesosRapidos';
import { MateriaCard } from './dashboard/MateriaCard';
import { PanelAcciones, type AccionRequerida } from './dashboard/PanelAcciones';
import { AgendaForo } from './dashboard/AgendaForo';
import { modulesForRole } from '../config/modules';
import { colorMateria } from '../utils/format';
import type { RolUsuario } from '../types';

const ROL_LABEL: Record<RolUsuario, string> = {
  ALUMNO: 'Alumno',
  DOCENTE: 'Docente',
  ADMINISTRACION: 'Administración',
  SUPERADMIN: 'Dirección / IT',
};

interface DocenteMateriaItem {
  materiaId: string;
  materia: {
    id: string;
    codigo: string;
    nombre: string;
    anio: number;
    cuatrimestre: number;
    carrera: string;
  };
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const isAlumno = usuario?.rol === 'ALUMNO';
  const isDocente = usuario?.rol === 'DOCENTE';
  const year = new Date().getFullYear();

  const alumno = useApi(() => (isAlumno ? alumnosApi.me() : Promise.resolve(null)), [isAlumno]);
  const inscripciones = useApi(
    () =>
      isAlumno
        ? inscripcionesApi.list({ cicloLectivo: year, pageSize: 50 })
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

  const cursadas = useMemo(
    () =>
      inscripciones.data?.items.filter((i) => i.tipo === 'CURSADA' && i.estado !== 'CANCELADA') ??
      [],
    [inscripciones.data],
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

  if (!usuario) return <FullPageLoader />;
  const modules = modulesForRole(usuario.rol);

  // ── Docente ─────────────────────────────────────────────────────────────
  if (isDocente) {
    if (misMaterias.loading) return <FullPageLoader />;
    const materias = (misMaterias.data ?? []) as DocenteMateriaItem[];

    return (
      <div className="mx-auto max-w-screen-2xl">
        <CampusHero
          nombre={usuario.nombre}
          rolLabel="Docente"
          subtitle={`Ciclo lectivo ${year}`}
          stats={[{ label: 'Materias', value: materias.length }]}
        />

        <AccesosRapidos modules={modules} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Mis materias</h2>
            <Link to="/mis-materias" className="btn-ghost text-sm">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>

          {materias.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <GraduationCap size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-700">Todavía no tenés materias asignadas</p>
                <p className="mt-1 text-sm text-slate-500">
                  Contactá al administrador para que te asigne tus cátedras.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {materias.map((dm) => {
                const c = colorMateria(dm.materia.codigo);
                return (
                  <Card key={dm.materiaId} className="flex flex-col">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {dm.materia.codigo.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{dm.materia.nombre}</p>
                        <p className="text-xs text-slate-500">
                          {dm.materia.codigo} · {dm.materia.anio}° año ·{' '}
                          {dm.materia.cuatrimestre === 0
                            ? 'Anual'
                            : `${dm.materia.cuatrimestre}° cuatr.`}
                        </p>
                        <Badge tone="neutral" className="mt-2">
                          {dm.materia.carrera.split(' ').slice(-1)[0]}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <Link
                        to={`/materias/${dm.materia.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy-50 px-3 py-2 text-xs font-semibold text-navy-700 transition-colors hover:bg-navy-100"
                      >
                        <MessageSquare size={13} /> Foro
                      </Link>
                      <Link
                        to="/mis-materias"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        <ClipboardCheck size={13} /> Calificar
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6">
          <AgendaForo />
        </div>
      </div>
    );
  }

  // ── Staff / administración ────────────────────────────────────────────────
  if (!isAlumno) {
    if (constancias.loading) return <FullPageLoader />;

    return (
      <div className="mx-auto max-w-screen-2xl">
        <CampusHero
          nombre={usuario.nombre}
          rolLabel={ROL_LABEL[usuario.rol]}
          subtitle="Gestión académica del instituto"
        />

        <AccesosRapidos modules={modules} />

        {constancias.data && constancias.data.items.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Constancias recientes</h2>
              <Link to="/constancias" className="btn-ghost text-sm">
                Ver todas <ArrowRight size={14} />
              </Link>
            </div>
            <Card>
              <ul className="divide-y divide-slate-100">
                {constancias.data.items.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-slate-900">
                      {c.tipo.replace(/_/g, ' ')} —{' '}
                      {c.alumno ? `${c.alumno.apellido}, ${c.alumno.nombre}` : '—'}
                    </span>
                    <Badge
                      tone={
                        c.estado === 'EMITIDA'
                          ? 'success'
                          : c.estado === 'RECHAZADA'
                            ? 'danger'
                            : 'neutral'
                      }
                    >
                      {c.estado}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </div>
    );
  }

  // ── Alumno ────────────────────────────────────────────────────────────────
  if (alumno.loading || inscripciones.loading) return <FullPageLoader />;
  if (alumno.error) return <ErrorAlert message={alumno.error} />;
  if (!alumno.data) return null;

  const aprobadas = cursadas.filter((i) => i.estadoCursada === 'APROBADA').length;
  const enCurso = cursadas.filter((i) => i.estadoCursada === 'EN_CURSO').length;

  return (
    <div className="mx-auto max-w-screen-2xl">
      <CampusHero
        nombre={usuario.nombre}
        rolLabel="Alumno"
        subtitle={alumno.data.carrera}
        stats={[
          { label: 'Inscriptas', value: cursadas.length },
          { label: 'En curso', value: enCurso },
          { label: 'Aprobadas', value: aprobadas },
        ]}
      />

      <AccesosRapidos modules={modules} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Mi cursada</h3>
                <p className="text-xs text-slate-500">
                  {cursadas.length}{' '}
                  {cursadas.length === 1 ? 'materia inscripta' : 'materias inscriptas'} ·{' '}
                  {new Date().getMonth() < 6 ? '1°' : '2°'} cuatr. {year}
                </p>
              </div>
              <Link to="/legajo" className="btn-ghost text-sm">
                Ver legajo <ArrowRight size={14} />
              </Link>
            </div>

            {cursadas.length === 0 ? (
              <p className="text-sm italic text-slate-500">
                No tenés materias inscriptas este cuatrimestre.{' '}
                <Link to="/inscripciones" className="not-italic text-navy-700 hover:underline">
                  Inscribite ahora →
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {cursadas.map((i) => (
                  <MateriaCard
                    key={i.id}
                    codigo={i.materia?.codigo ?? '—'}
                    nombre={i.materia?.nombre ?? 'Materia'}
                    to={i.materia?.id ? `/materias/${i.materia.id}` : undefined}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-slate-900">Próximos finales</h3>
            <p className="mb-4 text-xs text-slate-500">
              Mesas de examen disponibles e inscripciones activas
            </p>
            <ListaMesas />
          </Card>
        </div>

        <aside className="space-y-6">
          <PanelAcciones acciones={acciones} />
          <AgendaForo />
        </aside>
      </div>
    </div>
  );
}

function ListaMesas() {
  const mesas = useApi(() => inscripcionesApi.list({ tipo: 'MESA_EXAMEN', pageSize: 5 }), []);

  if (mesas.loading) return <Spinner />;
  if (!mesas.data?.items.length) {
    return <p className="text-sm italic text-slate-500">No hay mesas registradas todavía.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {mesas.data.items.map((m) => (
        <li key={m.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 text-center">
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
              {m.materia?.id ? (
                <Link
                  to={`/materias/${m.materia.id}`}
                  className="text-sm font-semibold text-slate-900 hover:text-navy-700 hover:underline"
                >
                  {m.materia.nombre}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-slate-900">{m.materia?.nombre ?? '—'}</p>
              )}
              <p className="text-xs text-slate-500">{m.observaciones ?? 'Mesa de examen final'}</p>
            </div>
          </div>
          <span className="text-xs text-slate-500">{m.estado}</span>
        </li>
      ))}
    </ul>
  );
}
