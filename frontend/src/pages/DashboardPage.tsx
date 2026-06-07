import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, MessageSquare, ClipboardCheck, BookOpen } from 'lucide-react';
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
import { AgendaForo, ProximosExamenes, NovedadesForo } from './dashboard/AgendaForo';
import { foroApi } from '../api/foro.api';
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
  const agenda = useApi(
    () => (isAlumno ? foroApi.agenda() : Promise.resolve(null)),
    [isAlumno],
  );
  const misInscripciones = useApi(
    () =>
      isDocente
        ? inscripcionesApi.list({ tipo: 'CURSADA', cicloLectivo: year, pageSize: 100 })
        : Promise.resolve(null),
    [isDocente],
  );

  const cursadas = useMemo(
    () =>
      inscripciones.data?.items.filter((i) => i.tipo === 'CURSADA' && i.estado !== 'CANCELADA') ??
      [],
    [inscripciones.data],
  );

  const statsPorMateria = useMemo(() => {
    const map = new Map<
      string,
      { total: number; enCurso: number; regulares: number; aprobados: number; reprobados: number }
    >();
    for (const i of misInscripciones.data?.items ?? []) {
      const mid = i.materiaId;
      if (!map.has(mid))
        map.set(mid, { total: 0, enCurso: 0, regulares: 0, aprobados: 0, reprobados: 0 });
      const s = map.get(mid)!;
      s.total++;
      if (i.estadoCursada === 'EN_CURSO') s.enCurso++;
      else if (i.estadoCursada === 'REGULAR') s.regulares++;
      else if (i.estadoCursada === 'APROBADA') s.aprobados++;
      else if (i.estadoCursada === 'REPROBADA') s.reprobados++;
    }
    return map;
  }, [misInscripciones.data]);

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
    const inscLoading = misInscripciones.loading;
    const totalAlumnos = [...statsPorMateria.values()].reduce((a, s) => a + s.total, 0);
    const totalEnCurso = [...statsPorMateria.values()].reduce((a, s) => a + s.enCurso, 0);

    return (
      <div className="mx-auto max-w-screen-xl">
        <CampusHero
          nombre={usuario.nombre}
          rolLabel="Docente"
          subtitle={`Ciclo lectivo ${year}`}
          stats={[
            { label: 'Cátedras', value: materias.length },
            { label: 'Alumnos', value: inscLoading ? '…' : totalAlumnos },
            { label: 'En curso', value: inscLoading ? '…' : totalEnCurso },
          ]}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
          {/* Columna principal: mis cátedras con alumnos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Mis cátedras</h2>
              <Link to="/mis-materias" className="btn-ghost text-sm">
                Calificaciones <ArrowRight size={14} />
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
              <div className="space-y-3">
                {materias.map((dm) => {
                  const stats = statsPorMateria.get(dm.materia.id) ?? {
                    total: 0, enCurso: 0, regulares: 0, aprobados: 0, reprobados: 0,
                  };
                  const calificados = stats.total - stats.enCurso;
                  const pct = stats.total > 0 ? Math.round((calificados / stats.total) * 100) : 0;
                  const c = colorMateria(dm.materia.codigo);

                  return (
                    <Card key={dm.materiaId}>
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                          style={{ backgroundColor: c.bg, color: c.text }}
                        >
                          {dm.materia.codigo.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900 leading-snug">
                                {dm.materia.nombre}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {dm.materia.codigo} · {dm.materia.anio}° año ·{" "}
                                {dm.materia.cuatrimestre === 0 ? 'Anual' : `${dm.materia.cuatrimestre}° cuatr.`}
                              </p>
                            </div>
                            <Badge tone="neutral" className="shrink-0">
                              {dm.materia.carrera.split(' ').slice(-1)[0]}
                            </Badge>
                          </div>

                          {inscLoading ? (
                            <div className="mt-3 flex items-center gap-2">
                              <Spinner size={12} />
                              <span className="text-xs text-slate-400">Cargando alumnos…</span>
                            </div>
                          ) : stats.total === 0 ? (
                            <p className="mt-2 text-xs text-slate-400 italic">Sin alumnos inscriptos</p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{calificados} de {stats.total} calificados</span>
                                <span className="font-semibold">{pct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-teal-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {stats.enCurso > 0 && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                    {stats.enCurso} en curso
                                  </span>
                                )}
                                {stats.regulares > 0 && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                    {stats.regulares} regulares
                                  </span>
                                )}
                                {stats.aprobados > 0 && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    {stats.aprobados} aprobados
                                  </span>
                                )}
                                {stats.reprobados > 0 && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                    {stats.reprobados} reprobados
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                        <Link
                          to={`/materias/${dm.materia.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-navy-100"
                        >
                          <MessageSquare size={12} /> Foro
                        </Link>
                        <Link
                          to="/mis-materias"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                        >
                          <ClipboardCheck size={12} /> Calificar
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Columna lateral: agenda del foro (próximos exámenes + novedades) */}
          <aside>
            <AgendaForo />
          </aside>
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

      {/* Acciones requeridas: lo primero que el alumno debe resolver */}
      {acciones.length > 0 && (
        <div className="mb-6">
          <PanelAcciones acciones={acciones} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        {/* Columna principal: materias (uso diario) + novedades */}
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Mis materias</h3>
                <p className="text-xs text-slate-500">
                  {cursadas.length}{' '}
                  {cursadas.length === 1 ? 'materia inscripta' : 'materias inscriptas'} ·{' '}
                  {new Date().getMonth() < 6 ? '1°' : '2°'} cuatr. {year} · entrá al foro de cada una
                </p>
              </div>
              <Link to="/inscripciones" className="btn-ghost text-sm">
                Inscribirme <ArrowRight size={14} />
              </Link>
            </div>

            {cursadas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <BookOpen size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No tenés materias inscriptas este cuatrimestre.
                </p>
                <Link
                  to="/inscripciones"
                  className="btn-primary mt-3 inline-flex text-sm"
                >
                  Inscribirme a una materia
                </Link>
              </div>
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

          {agenda.loading ? (
            <Card>
              <Spinner className="mx-auto" />
            </Card>
          ) : (
            <NovedadesForo novedades={agenda.data?.novedades ?? []} />
          )}
        </div>

        {/* Columna lateral: lo urgente / con fecha */}
        <aside className="space-y-6">
          {agenda.loading ? (
            <Card>
              <Spinner className="mx-auto" />
            </Card>
          ) : (
            <ProximosExamenes examenes={agenda.data?.examenes ?? []} />
          )}

          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Próximos finales</h3>
              <Link to="/inscripciones" className="btn-ghost text-xs">
                Anotarme
              </Link>
            </div>
            <p className="mb-4 text-xs text-slate-500">Mesas de examen e inscripciones activas</p>
            <ListaMesas />
          </Card>
        </aside>
      </div>

      {/* Navegación secundaria */}
      <div className="mt-8">
        <AccesosRapidos modules={modules} />
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
