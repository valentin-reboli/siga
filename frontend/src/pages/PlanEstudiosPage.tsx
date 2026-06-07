import { useMemo } from 'react';
import { Lock, CheckCircle2, Circle, AlertCircle, Clock, BookMarked } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { alumnosApi } from '../api/alumnos.api';
import { materiasApi } from '../api/materias.api';
import { FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import type { Materia, Inscripcion } from '../types';

// ── Status types ──────────────────────────────────────────────────────────────

type StatusMateria =
  | { tipo: 'APROBADA'; nota: number | null }
  | { tipo: 'REGULAR'; nota: number | null }
  | { tipo: 'EN_CURSO' }
  | { tipo: 'REPROBADA'; nota: number | null }
  | { tipo: 'LIBRE' }
  | { tipo: 'DISPONIBLE' }
  | { tipo: 'BLOQUEADA'; faltantes: { nombre: string; codigo: string; req: string }[] };

// ── Status logic ──────────────────────────────────────────────────────────────

function calcularStatus(
  materia: Materia,
  historial: Inscripcion[],
  statusMap: Map<string, StatusMateria>,
): StatusMateria {
  const entradas = historial.filter(
    (i) => i.materiaId === materia.id && i.tipo === 'CURSADA',
  );

  if (entradas.length > 0) {
    // Orden de prioridad de estado
    const prioridad = ['APROBADA', 'REGULAR', 'EN_CURSO', 'REPROBADA', 'LIBRE'];
    entradas.sort((a, b) => {
      const pa = prioridad.indexOf(a.estadoCursada ?? '');
      const pb = prioridad.indexOf(b.estadoCursada ?? '');
      return pa - pb;
    });
    const mejor = entradas[0];
    switch (mejor.estadoCursada) {
      case 'APROBADA':
        return { tipo: 'APROBADA', nota: mejor.nota };
      case 'REGULAR':
        return { tipo: 'REGULAR', nota: mejor.nota };
      case 'EN_CURSO':
        return { tipo: 'EN_CURSO' };
      case 'REPROBADA':
        return { tipo: 'REPROBADA', nota: mejor.nota };
      case 'LIBRE':
        return { tipo: 'LIBRE' };
    }
  }

  // Sin inscripciones: chequear correlatividades
  const correlativas = materia.correlativasRequeridas ?? [];
  if (correlativas.length === 0) return { tipo: 'DISPONIBLE' };

  const faltantes: { nombre: string; codigo: string; req: string }[] = [];
  for (const corr of correlativas) {
    const statusReq = statusMap.get(corr.requiereId);
    const tieneAprobada = statusReq?.tipo === 'APROBADA';
    const tieneRegular = statusReq?.tipo === 'REGULAR' || tieneAprobada;

    const ok =
      corr.tipo === 'APROBADA'
        ? tieneAprobada
        : tieneRegular;

    if (!ok) {
      const reqMateria = corr.requiere;
      faltantes.push({
        nombre: reqMateria?.nombre ?? 'Materia requerida',
        codigo: reqMateria?.codigo ?? '',
        req: corr.tipo === 'APROBADA' ? 'aprobada' : 'regular',
      });
    }
  }

  if (faltantes.length > 0) return { tipo: 'BLOQUEADA', faltantes };
  return { tipo: 'DISPONIBLE' };
}

// ── Visual config per status ──────────────────────────────────────────────────

const STATUS_STYLE: Record<
  StatusMateria['tipo'],
  { bg: string; border: string; text: string; label: string; icon: React.ReactNode }
> = {
  APROBADA: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    label: 'Aprobada',
    icon: <CheckCircle2 size={13} className="text-emerald-500" />,
  },
  REGULAR: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    label: 'Regular',
    icon: <BookMarked size={13} className="text-blue-500" />,
  },
  EN_CURSO: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    label: 'En curso',
    icon: <Clock size={13} className="text-amber-500" />,
  },
  REPROBADA: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: 'Reprobada',
    icon: <AlertCircle size={13} className="text-red-400" />,
  },
  LIBRE: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: 'Libre',
    icon: <AlertCircle size={13} className="text-red-400" />,
  },
  DISPONIBLE: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    label: 'Disponible',
    icon: <Circle size={13} className="text-slate-400" />,
  },
  BLOQUEADA: {
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-400',
    label: 'Bloqueada',
    icon: <Lock size={13} className="text-slate-400" />,
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export function PlanEstudiosPage() {
  const { usuario } = useAuth();

  const alumno = useApi(
    () => (usuario?.rol === 'ALUMNO' ? alumnosApi.me() : Promise.resolve(null)),
    [usuario?.id],
  );

  const legajo = useApi(
    () => (alumno.data ? alumnosApi.getLegajo(alumno.data.id) : Promise.resolve(null)),
    [alumno.data?.id],
  );

  const materias = useApi(
    () =>
      alumno.data
        ? materiasApi.list({ carrera: alumno.data.carrera, pageSize: 200 })
        : Promise.resolve(null),
    [alumno.data?.carrera],
  );

  if (alumno.loading || legajo.loading || materias.loading) return <FullPageLoader />;
  if (alumno.error) return <ErrorAlert message={alumno.error} />;
  if (!alumno.data) return null;

  return (
    <PlanEstudiosView
      alumnoNombre={`${alumno.data.nombre} ${alumno.data.apellido}`}
      legajo={alumno.data.legajo}
      carrera={alumno.data.carrera}
      anioIngreso={alumno.data.anioIngreso}
      todasMaterias={materias.data?.items ?? []}
      historial={legajo.data?.historial ?? []}
      estadisticas={legajo.data?.estadisticas}
    />
  );
}

// ── PlanEstudiosView ──────────────────────────────────────────────────────────

function PlanEstudiosView({
  alumnoNombre,
  legajo,
  carrera,
  anioIngreso,
  todasMaterias,
  historial,
  estadisticas,
}: {
  alumnoNombre: string;
  legajo: string;
  carrera: string;
  anioIngreso: number;
  todasMaterias: Materia[];
  historial: Inscripcion[];
  estadisticas?: { totalMaterias: number; aprobadas: number; regulares: number };
}) {
  // Primero calculamos el status de materias sin correlatividades (para resolver dependencias)
  const statusMap = useMemo(() => {
    const map = new Map<string, StatusMateria>();

    // Ordenar por año/cuatrimestre para resolver en orden
    const ordenadas = [...todasMaterias].sort(
      (a, b) => a.anio - b.anio || a.cuatrimestre - b.cuatrimestre,
    );

    // Primera pasada: solo materias sin correlativas
    for (const m of ordenadas) {
      if ((m.correlativasRequeridas ?? []).length === 0) {
        map.set(m.id, calcularStatus(m, historial, map));
      }
    }
    // Segunda pasada: materias con correlativas (usando los status ya resueltos)
    for (const m of ordenadas) {
      if ((m.correlativasRequeridas ?? []).length > 0 && !map.has(m.id)) {
        map.set(m.id, calcularStatus(m, historial, map));
      }
    }
    // Tercera pasada: cualquier restante
    for (const m of ordenadas) {
      if (!map.has(m.id)) {
        map.set(m.id, calcularStatus(m, historial, map));
      }
    }

    return map;
  }, [todasMaterias, historial]);

  // Agrupar por año → cuatrimestre
  const porAnio = useMemo(() => {
    const map = new Map<number, Map<number, Materia[]>>();
    for (const m of todasMaterias) {
      if (!map.has(m.anio)) map.set(m.anio, new Map());
      const anioMap = map.get(m.anio)!;
      if (!anioMap.has(m.cuatrimestre)) anioMap.set(m.cuatrimestre, []);
      anioMap.get(m.cuatrimestre)!.push(m);
    }
    return map;
  }, [todasMaterias]);

  const anios = [...porAnio.keys()].sort((a, b) => a - b);

  const aprobadas = [...statusMap.values()].filter((s) => s.tipo === 'APROBADA').length;
  const total = todasMaterias.length;
  const progreso = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Plan de estudios' }]} />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Plan de estudios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {carrera} · Legajo {legajo} · Ingreso {anioIngreso}
          </p>
        </div>
        {/* Barra de progreso */}
        <div className="min-w-[220px]">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{aprobadas} de {total} aprobadas</span>
            <span className="font-semibold text-emerald-600">{progreso}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        {(
          [
            'APROBADA',
            'REGULAR',
            'EN_CURSO',
            'REPROBADA',
            'DISPONIBLE',
            'BLOQUEADA',
          ] as StatusMateria['tipo'][]
        ).map((tipo) => {
          const s = STATUS_STYLE[tipo];
          return (
            <span
              key={tipo}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.text} font-medium`}
            >
              {s.icon} {s.label}
            </span>
          );
        })}
      </div>

      {todasMaterias.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No hay materias cargadas para esta carrera.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {anios.map((anio) => {
            const cuatrimestres = [...(porAnio.get(anio)?.keys() ?? [])].sort((a, b) => a - b);
            return (
              <section key={anio}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-serif text-lg font-semibold text-navy-900">
                    {anio}° Año
                  </h2>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cuatrimestres.map((cuatr) => {
                    const mats = porAnio.get(anio)?.get(cuatr) ?? [];
                    return (
                      <div key={cuatr}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          {cuatr}° Cuatrimestre
                        </p>
                        <div className="space-y-2">
                          {mats
                            .sort((a, b) => a.nombre.localeCompare(b.nombre))
                            .map((m) => {
                              const status = statusMap.get(m.id) ?? { tipo: 'DISPONIBLE' as const };
                              return <MateriaCard key={m.id} materia={m} status={status} />;
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MateriaCard ───────────────────────────────────────────────────────────────

function MateriaCard({ materia, status }: { materia: Materia; status: StatusMateria }) {
  const s = STATUS_STYLE[status.tipo];
  const nota =
    status.tipo === 'APROBADA' || status.tipo === 'REGULAR' || status.tipo === 'REPROBADA'
      ? status.nota
      : null;

  const bloqueada = status.tipo === 'BLOQUEADA';

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${s.bg} ${s.border} ${bloqueada ? 'opacity-60' : ''}`}
      title={
        bloqueada
          ? `Requiere: ${(status as { tipo: 'BLOQUEADA'; faltantes: { nombre: string; req: string }[] }).faltantes
              .map((f) => `${f.nombre} (${f.req})`)
              .join(', ')}`
          : undefined
      }
    >
      {/* Ícono de estado */}
      <span className="mt-0.5 shrink-0">{s.icon}</span>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${s.text} ${bloqueada ? 'line-through decoration-slate-300' : ''}`}>
          {materia.nombre}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {materia.codigo} · {materia.cargaHoraria}h
        </p>

        {/* Faltantes para desbloquearse */}
        {bloqueada && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(status as { tipo: 'BLOQUEADA'; faltantes: { nombre: string; codigo: string; req: string }[] }).faltantes.map(
              (f, i) => (
                <span
                  key={i}
                  className="inline-block text-[10px] bg-slate-200 text-slate-500 rounded px-1.5 py-0.5"
                >
                  {f.codigo || f.nombre} ({f.req})
                </span>
              ),
            )}
          </div>
        )}
      </div>

      {/* Nota (si hay) */}
      {nota != null && (
        <span
          className={`shrink-0 text-sm font-bold tabular-nums ${
            status.tipo === 'APROBADA' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          {nota % 1 === 0 ? nota : nota.toFixed(1)}
        </span>
      )}

      {/* Badge de estado compacto */}
      <span
        className={`shrink-0 self-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}
      >
        {s.label}
      </span>
    </div>
  );
}
