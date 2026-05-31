import { useMemo, useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { alumnosApi } from '../api/alumnos.api';
import { materiasApi } from '../api/materias.api';
import { inscripcionesApi } from '../api/inscripciones.api';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import type { EstadoInscripcion, Inscripcion } from '../types';

export function InscripcionesPage() {
  const { usuario } = useAuth();
  const alumno = useApi(() => alumnosApi.me(), []);
  const cicloLectivo = new Date().getFullYear();

  const inscripciones = useApi(
    () => inscripcionesApi.list({ cicloLectivo, pageSize: 50 }),
    [cicloLectivo],
  );

  const [modalAbierto, setModalAbierto] = useState(false);

  if (alumno.loading) return <FullPageLoader />;
  if (alumno.error) return <ErrorAlert message={alumno.error} />;
  if (!alumno.data || !usuario) return null;

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Inscripciones' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Inscripciones</h1>
          <p className="text-sm text-slate-500">
            Ciclo lectivo {cicloLectivo} · {alumno.data.carrera}
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)} leftIcon={<Plus size={16} />}>
          Nueva inscripción
        </Button>
      </div>

      <Card>
        <CardHeader title="Mis inscripciones" subtitle="Cursadas y mesas activas" />
        {inscripciones.loading ? (
          <Spinner />
        ) : inscripciones.error ? (
          <ErrorAlert message={inscripciones.error} />
        ) : !inscripciones.data?.items.length ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            Aún no te inscribiste a ninguna materia este ciclo.
          </p>
        ) : (
          <TablaInscripciones
            items={inscripciones.data.items}
            onCancel={async (id) => {
              await inscripcionesApi.cancel(id);
              inscripciones.reload();
            }}
          />
        )}
      </Card>

      {modalAbierto && (
        <ModalNuevaInscripcion
          alumnoId={alumno.data.id}
          carrera={alumno.data.carrera}
          cicloLectivo={cicloLectivo}
          onClose={() => setModalAbierto(false)}
          onCreada={() => {
            setModalAbierto(false);
            inscripciones.reload();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Tabla de inscripciones
// ============================================================

interface TablaProps {
  items: Inscripcion[];
  onCancel: (id: string) => Promise<void>;
}

function TablaInscripciones({ items, onCancel }: TablaProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
          <tr>
            <th className="text-left py-2 px-2 font-medium">Materia</th>
            <th className="text-left py-2 px-2 font-medium">Tipo</th>
            <th className="text-left py-2 px-2 font-medium">Estado</th>
            <th className="text-left py-2 px-2 font-medium">Cursada</th>
            <th className="text-left py-2 px-2 font-medium">Nota</th>
            <th className="text-left py-2 px-2 font-medium">Inscripta</th>
            <th className="text-right py-2 px-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((i) => (
            <tr key={i.id} className="hover:bg-slate-50">
              <td className="py-3 px-2">
                <p className="font-medium text-slate-900">{i.materia?.nombre}</p>
                <p className="text-xs text-slate-500">{i.materia?.codigo}</p>
              </td>
              <td className="py-3 px-2">
                {i.tipo === 'CURSADA' ? (
                  <Badge tone="navy">Cursada</Badge>
                ) : (
                  <Badge tone="info">Mesa</Badge>
                )}
              </td>
              <td className="py-3 px-2">
                <EstadoChip estado={i.estado} />
              </td>
              <td className="py-3 px-2 text-slate-700">{i.estadoCursada ?? '—'}</td>
              <td className="py-3 px-2 text-slate-700">{i.nota ?? '—'}</td>
              <td className="py-3 px-2 text-slate-500">{formatDate(i.fechaInscripcion)}</td>
              <td className="py-3 px-2 text-right">
                {i.estado !== 'CANCELADA' && i.estadoCursada !== 'APROBADA' && (
                  <button
                    onClick={() => onCancel(i.id)}
                    className="text-slate-500 hover:text-danger inline-flex items-center gap-1 text-xs font-medium"
                  >
                    <Trash2 size={14} /> Cancelar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EstadoChip({ estado }: { estado: EstadoInscripcion }) {
  const cfg = {
    CONFIRMADA: { tono: 'success' as const, icon: <CheckCircle2 size={12} />, label: 'Confirmada' },
    PENDIENTE: { tono: 'warn' as const, icon: <Clock3 size={12} />, label: 'Pendiente' },
    RECHAZADA: { tono: 'danger' as const, icon: <XCircle size={12} />, label: 'Rechazada' },
    CANCELADA: { tono: 'neutral' as const, icon: <XCircle size={12} />, label: 'Cancelada' },
  }[estado];

  return (
    <Badge tone={cfg.tono}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

// ============================================================
// Modal: nueva inscripción
// ============================================================

interface ModalProps {
  alumnoId: string;
  carrera: string;
  cicloLectivo: number;
  onClose: () => void;
  onCreada: () => void;
}

function ModalNuevaInscripcion({ alumnoId, carrera, cicloLectivo, onClose, onCreada }: ModalProps) {
  const materias = useApi(
    () => materiasApi.list({ carrera, activa: true, pageSize: 100 }),
    [carrera],
  );

  const [materiaId, setMateriaId] = useState('');
  const [tipo, setTipo] = useState<'CURSADA' | 'MESA_EXAMEN'>('CURSADA');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opciones = useMemo(
    () => materias.data?.items ?? [],
    [materias.data],
  );

  async function handleSubmit() {
    setError(null);
    if (!materiaId) {
      setError('Seleccioná una materia');
      return;
    }
    setSubmitting(true);
    try {
      await inscripcionesApi.create({ alumnoId, materiaId, tipo, cicloLectivo });
      onCreada();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo crear la inscripción'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-serif text-xl font-semibold text-navy-900">Nueva inscripción</h3>
        <p className="text-sm text-slate-500 mb-4">
          Las correlatividades y cupos se verifican automáticamente.
        </p>

        {error && (
          <div className="mb-3">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="form-label">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'CURSADA' | 'MESA_EXAMEN')}
              className="form-input"
            >
              <option value="CURSADA">Cursada</option>
              <option value="MESA_EXAMEN">Mesa de examen</option>
            </select>
          </div>

          <div>
            <label className="form-label">Materia</label>
            {materias.loading ? (
              <Spinner />
            ) : (
              <select
                value={materiaId}
                onChange={(e) => setMateriaId(e.target.value)}
                className="form-input"
              >
                <option value="">Seleccioná una materia…</option>
                {opciones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} — {m.nombre} · {m.anio}° año
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size={16} className="text-white" /> : 'Inscribirme'}
          </Button>
        </div>
      </div>
    </div>
  );
}
