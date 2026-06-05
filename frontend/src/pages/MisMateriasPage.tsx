import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { usuariosApi } from '../api/usuarios.api';
import { inscripcionesApi } from '../api/inscripciones.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import type { EstadoCursada, EstadoInscripcion, Inscripcion } from '../types';

export function MisMateriasPage() {
  const { usuario } = useAuth();

  const misAsignaciones = useApi(
    () => (usuario ? usuariosApi.getMaterias(usuario.id) : Promise.resolve([])),
    [usuario?.id],
  );

  if (misAsignaciones.loading) return <FullPageLoader />;

  const materias: Array<{ materiaId: string; materia: { id: string; codigo: string; nombre: string; anio: number; cuatrimestre: number; carrera: string } }> = misAsignaciones.data ?? [];

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Mis materias' }]} />

      <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">Mis materias</h1>
      <p className="text-sm text-slate-500 mb-6">
        Materias asignadas · podés cargar notas y estados de cursada
      </p>

      {materias.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm">Todavía no tenés materias asignadas.</p>
            <p className="text-slate-400 text-xs mt-1">
              Contactá al administrador para que te asigne materias.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {materias.map((dm) => (
            <MateriaConAlumnos key={dm.materiaId} materia={dm.materia} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Materia expandible con lista de inscriptos ────────────────────────────────

function MateriaConAlumnos({
  materia,
}: {
  materia: { id: string; codigo: string; nombre: string; anio: number; cuatrimestre: number; carrera: string };
}) {
  const [abierta, setAbierta] = useState(false);
  const [editando, setEditando] = useState<Inscripcion | null>(null);

  const inscripciones = useApi(
    () =>
      abierta
        ? inscripcionesApi.list({ materiaId: materia.id, pageSize: 100 })
        : Promise.resolve(null),
    [abierta, materia.id],
  );

  const cursadas = inscripciones.data?.items.filter((i) => i.tipo === 'CURSADA') ?? [];
  const aprobadas = cursadas.filter((i) => i.estadoCursada === 'APROBADA').length;
  const enCurso = cursadas.filter((i) => i.estadoCursada === 'EN_CURSO').length;

  return (
    <Card>
      <button
        onClick={() => setAbierta((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-xs font-semibold text-navy-700 shrink-0">
            {materia.codigo.slice(-3)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{materia.nombre}</p>
            <p className="text-xs text-slate-500">
              {materia.codigo} · {materia.anio}° año · {materia.cuatrimestre}° cuatr. · {materia.carrera}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {abierta && inscripciones.data && (
            <div className="flex gap-3 text-xs text-slate-500">
              <span>{cursadas.length} inscriptos</span>
              <span className="text-emerald-600">{aprobadas} aprobados</span>
              <span className="text-amber-600">{enCurso} en curso</span>
            </div>
          )}
          <span className="text-slate-400">
            {abierta ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        </div>
      </button>

      {abierta && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {inscripciones.loading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : inscripciones.error ? (
            <ErrorAlert message={inscripciones.error} />
          ) : cursadas.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4">
              No hay alumnos inscriptos en cursada para esta materia.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium">Alumno</th>
                    <th className="text-left py-2 px-2 font-medium">Legajo</th>
                    <th className="text-left py-2 px-2 font-medium">Estado</th>
                    <th className="text-left py-2 px-2 font-medium">Cursada</th>
                    <th className="text-left py-2 px-2 font-medium">Nota</th>
                    <th className="text-right py-2 px-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cursadas.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 font-medium text-slate-900">
                        {i.alumno ? `${i.alumno.apellido}, ${i.alumno.nombre}` : '—'}
                      </td>
                      <td className="py-3 px-2 text-slate-500">{i.alumno?.legajo}</td>
                      <td className="py-3 px-2"><EstadoChip estado={i.estado} /></td>
                      <td className="py-3 px-2">
                        <EstadoCursadaChip estado={i.estadoCursada} />
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-900">{i.nota ?? '—'}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => setEditando(i)}
                          className="text-slate-400 hover:text-navy-700 inline-flex items-center gap-1 text-xs font-medium"
                        >
                          <Pencil size={13} /> Calificar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editando && (
        <ModalCalificar
          inscripcion={editando}
          onClose={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            inscripciones.reload();
          }}
        />
      )}
    </Card>
  );
}

// ── Modal calificar ───────────────────────────────────────────────────────────

function ModalCalificar({
  inscripcion,
  onClose,
  onGuardado,
}: {
  inscripcion: Inscripcion;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [estadoCursada, setEstadoCursada] = useState<string>(inscripcion.estadoCursada ?? 'EN_CURSO');
  const [nota, setNota] = useState<string>(inscripcion.nota != null ? String(inscripcion.nota) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await inscripcionesApi.update(inscripcion.id, {
        estadoCursada: estadoCursada || undefined,
        nota: nota !== '' ? Number(nota) : undefined,
      });
      onGuardado();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo guardar'));
    } finally {
      setSubmitting(false);
    }
  }

  const alumnoNombre = inscripcion.alumno
    ? `${inscripcion.alumno.apellido}, ${inscripcion.alumno.nombre}`
    : '—';

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-serif text-xl font-semibold text-navy-900 mb-1">Calificar alumno</h3>
        <p className="text-sm text-slate-500 mb-4">{alumnoNombre}</p>

        {error && <div className="mb-3"><ErrorAlert message={error} /></div>}

        <div className="space-y-3">
          <div>
            <label className="form-label">Estado de cursada</label>
            <select
              value={estadoCursada}
              onChange={(e) => setEstadoCursada(e.target.value)}
              className="form-input"
            >
              <option value="EN_CURSO">En curso</option>
              <option value="REGULAR">Regular</option>
              <option value="APROBADA">Aprobada</option>
              <option value="REPROBADA">Reprobada</option>
              <option value="LIBRE">Libre</option>
            </select>
          </div>
          <div>
            <label className="form-label">Nota (0–10)</label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="form-input"
              placeholder="Ej: 7"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size={16} className="text-white" /> : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function EstadoChip({ estado }: { estado: EstadoInscripcion }) {
  const map: Record<EstadoInscripcion, { tone: 'success' | 'warn' | 'danger' | 'neutral'; label: string }> = {
    CONFIRMADA: { tone: 'success', label: 'Confirmada' },
    PENDIENTE: { tone: 'warn', label: 'Pendiente' },
    RECHAZADA: { tone: 'danger', label: 'Rechazada' },
    CANCELADA: { tone: 'neutral', label: 'Cancelada' },
  };
  const { tone, label } = map[estado];
  return <Badge tone={tone}>{label}</Badge>;
}

function EstadoCursadaChip({ estado }: { estado: EstadoCursada | null }) {
  if (!estado) return <span className="text-slate-400 text-xs">—</span>;
  const map: Record<EstadoCursada, 'success' | 'info' | 'danger' | 'warn' | 'neutral'> = {
    APROBADA: 'success', REGULAR: 'info', EN_CURSO: 'warn', REPROBADA: 'danger', LIBRE: 'neutral',
  };
  return <Badge tone={map[estado]}>{estado.replace('_', ' ')}</Badge>;
}
