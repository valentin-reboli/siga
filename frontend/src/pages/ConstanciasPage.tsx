import { useState } from 'react';
import { Plus, Download, ShieldCheck, Send, Trash2, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { alumnosApi } from '../api/alumnos.api';
import { constanciasApi } from '../api/constancias.api';
import { materiasApi } from '../api/materias.api';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import type { TipoConstancia, EstadoConstancia, Constancia } from '../types';

const TIPOS: { value: TipoConstancia; label: string; descripcion: string }[] = [
  {
    value: 'ALUMNO_REGULAR',
    label: 'Constancia de alumno regular',
    descripcion: 'Certifica que sos alumno activo de la institución. Requerida para trámites bancarios, laborales y beneficios.',
  },
  {
    value: 'ANALITICO_PARCIAL',
    label: 'Analítico parcial',
    descripcion: 'Detalla las materias aprobadas hasta la fecha. Útil para transferencias o becas.',
  },
  {
    value: 'ANALITICO_FINAL',
    label: 'Analítico final',
    descripcion: 'Historial académico completo al egreso. Requiere tener todas las materias aprobadas.',
  },
  {
    value: 'EXAMEN_FINAL',
    label: 'Constancia de examen final',
    descripcion: 'Certifica que rendiste (y aprobaste) un examen final específico.',
  },
  {
    value: 'TITULO_EN_TRAMITE',
    label: 'Título en trámite',
    descripcion: 'Certifica que el trámite de tu título está en curso. Solo disponible luego de egresar.',
  },
  {
    value: 'PROGRAMA_MATERIA',
    label: 'Programa de materia',
    descripcion: 'Copia oficial del programa de una materia. Requerida para equivalencias en otras instituciones.',
  },
];

export function ConstanciasPage() {
  const { usuario } = useAuth();
  const isAlumno = usuario?.rol === 'ALUMNO';
  const isStaff = usuario?.rol === 'SUPERADMIN' || usuario?.rol === 'ADMINISTRACION';
  const canEmit = isStaff; // gestión de constancias = SUPERADMIN / ADMINISTRACION

  const alumno = useApi(
    () => (isAlumno ? alumnosApi.me() : Promise.resolve(null)),
    [isAlumno],
  );
  const constancias = useApi(() => constanciasApi.list({ pageSize: 100 }), []);
  const [modalAbierto, setModalAbierto] = useState(false);

  if ((isAlumno && alumno.loading) || constancias.loading) return <FullPageLoader />;
  if (alumno.error) return <ErrorAlert message={alumno.error} />;

  // ── Vista admin / administrativo ───────────────────────────────────────────
  if (!isAlumno) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Constancias' }]} />
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Constancias</h1>
          <p className="text-sm text-slate-500">
            Gestión y emisión de constancias · {constancias.data?.total ?? 0} registros
          </p>
        </div>

        <Card>
          <CardHeader title="Todas las constancias" />
          {constancias.error ? (
            <ErrorAlert message={constancias.error} />
          ) : !constancias.data?.items.length ? (
            <p className="text-sm text-slate-500 italic py-6 text-center">
              No hay constancias registradas.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {constancias.data.items.map((c) => (
                <ItemConstanciaAdmin
                  key={c.id}
                  constancia={c}
                  puedeEmitir={canEmit}
                  onEmitida={() => constancias.reload()}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // ── Vista alumno ───────────────────────────────────────────────────────────
  if (!alumno.data) return null;

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Constancias' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Constancias</h1>
          <p className="text-sm text-slate-500">
            Solicitá y descargá documentación oficial con código de validación
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)} leftIcon={<Plus size={16} />}>
          Nueva solicitud
        </Button>
      </div>

      <Card>
        <CardHeader title="Mis constancias" />
        {!constancias.data?.items.length ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            Todavía no solicitaste constancias.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {constancias.data.items.map((c) => (
              <ItemConstanciaAlumno
                key={c.id}
                constancia={c}
                onCancelada={() => constancias.reload()}
              />
            ))}
          </ul>
        )}
      </Card>

      {modalAbierto && (
        <ModalNuevaConstancia
          alumnoId={alumno.data.id}
          carrera={alumno.data.carrera}
          onClose={() => setModalAbierto(false)}
          onCreada={() => {
            setModalAbierto(false);
            constancias.reload();
          }}
        />
      )}
    </div>
  );
}

// ── Item constancia para admin (con botón emitir) ─────────────────────────────

function ItemConstanciaAdmin({
  constancia,
  puedeEmitir,
  onEmitida,
}: {
  constancia: Constancia;
  puedeEmitir: boolean;
  onEmitida: () => void;
}) {
  const [emitiendo, setEmitiendo] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = TIPOS.find((t) => t.value === constancia.tipo)?.label ?? constancia.tipo;

  async function handleEmitir() {
    setError(null);
    setEmitiendo(true);
    try {
      await constanciasApi.emitir(constancia.id);
      onEmitida();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo emitir'));
    } finally {
      setEmitiendo(false);
    }
  }

  async function descargar() {
    setBajando(true);
    try {
      const blob = await constanciasApi.downloadPdf(constancia.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `constancia-${constancia.codigoVerificacion}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBajando(false);
    }
  }

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-slate-900">{label}</h4>
            <EstadoConstanciaChip estado={constancia.estado} />
          </div>
          {constancia.alumno && (
            <p className="text-sm text-slate-700 font-medium">
              {constancia.alumno.apellido}, {constancia.alumno.nombre}{' '}
              <span className="text-slate-500 font-normal">· {constancia.alumno.legajo}</span>
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Solicitada el {formatDate(constancia.fechaSolicitud)}
            {constancia.fechaEmision && ` · Emitida el ${formatDate(constancia.fechaEmision)}`}
          </p>
          <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
            <ShieldCheck size={12} /> Código:{' '}
            <code className="font-mono text-slate-700">{constancia.codigoVerificacion}</code>
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          {constancia.estado === 'EMITIDA' ? (
            <Button
              variant="secondary"
              onClick={descargar}
              disabled={bajando}
              leftIcon={<Download size={14} />}
            >
              {bajando ? <Spinner size={14} /> : 'PDF'}
            </Button>
          ) : puedeEmitir ? (
            <Button
              onClick={handleEmitir}
              disabled={emitiendo}
              leftIcon={<Send size={14} />}
            >
              {emitiendo ? <Spinner size={14} className="text-white" /> : 'Emitir'}
            </Button>
          ) : (
            <span className="text-xs text-slate-400 italic">Pendiente</span>
          )}
        </div>
      </div>
    </li>
  );
}

// ── Item constancia para alumno ───────────────────────────────────────────────

function ItemConstanciaAlumno({
  constancia,
  onCancelada,
}: {
  constancia: Constancia;
  onCancelada: () => void;
}) {
  const [bajando, setBajando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = TIPOS.find((t) => t.value === constancia.tipo)?.label ?? constancia.tipo;

  async function descargar() {
    setBajando(true);
    try {
      const blob = await constanciasApi.downloadPdf(constancia.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `constancia-${constancia.codigoVerificacion}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBajando(false);
    }
  }

  async function handleCancelar() {
    setError(null);
    setCancelando(true);
    try {
      await constanciasApi.cancelar(constancia.id);
      onCancelada();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cancelar'));
      setConfirmando(false);
    } finally {
      setCancelando(false);
    }
  }

  const puedeCancel = constancia.estado === 'SOLICITADA' || constancia.estado === 'EN_PROCESO';

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-slate-900">{label}</h4>
            <EstadoConstanciaChip estado={constancia.estado} />
          </div>
          <p className="text-xs text-slate-500">
            Solicitada el {formatDate(constancia.fechaSolicitud)}
            {constancia.fechaEmision && ` · Emitida el ${formatDate(constancia.fechaEmision)}`}
          </p>
          {/* Código solo visible cuando ya fue emitida */}
          {constancia.estado === 'EMITIDA' && (
            <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
              <ShieldCheck size={12} /> Código:{' '}
              <code className="font-mono text-slate-700">{constancia.codigoVerificacion}</code>
            </p>
          )}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {constancia.estado === 'EMITIDA' ? (
            <Button
              variant="secondary"
              onClick={descargar}
              disabled={bajando}
              leftIcon={<Download size={14} />}
            >
              {bajando ? <Spinner size={14} /> : 'Descargar PDF'}
            </Button>
          ) : puedeCancel ? (
            confirmando ? (
              <span className="inline-flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">¿Cancelar solicitud?</span>
                <button
                  onClick={handleCancelar}
                  disabled={cancelando}
                  className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  {cancelando ? '…' : 'Sí'}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  disabled={cancelando}
                  className="text-slate-400 hover:text-slate-700"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmando(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
              >
                <X size={13} /> Cancelar solicitud
              </button>
            )
          ) : (
            <span className="text-xs text-slate-400 italic">Pendiente de emisión</span>
          )}
        </div>
      </div>
    </li>
  );
}

function EstadoConstanciaChip({ estado }: { estado: EstadoConstancia }) {
  const map: Record<EstadoConstancia, 'success' | 'warn' | 'danger' | 'neutral'> = {
    EMITIDA: 'success', EN_PROCESO: 'warn', SOLICITADA: 'neutral', RECHAZADA: 'danger',
  };
  return <Badge tone={map[estado]}>{estado.replace('_', ' ').toLowerCase()}</Badge>;
}

// ── Modal nueva constancia (alumno) ──────────────────────────────────────────

interface ModalProps {
  alumnoId: string;
  carrera: string;
  onClose: () => void;
  onCreada: () => void;
}

function ModalNuevaConstancia({ alumnoId, carrera, onClose, onCreada }: ModalProps) {
  const [tipo, setTipo] = useState<TipoConstancia>('ALUMNO_REGULAR');
  const [motivo, setMotivo] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esProgramaMateria = tipo === 'PROGRAMA_MATERIA';

  // Solo cargamos materias cuando se selecciona PROGRAMA_MATERIA
  const materias = useApi(
    () =>
      esProgramaMateria
        ? materiasApi.list({ carrera, activa: true, pageSize: 100 })
        : Promise.resolve(null),
    [esProgramaMateria, carrera],
  );

  function handleTipoChange(nuevoTipo: TipoConstancia) {
    setTipo(nuevoTipo);
    setMateriaId(''); // reset al cambiar de tipo
  }

  async function handleSubmit() {
    setError(null);
    if (esProgramaMateria && !materiaId) {
      setError('Seleccioná la materia para la constancia de programa.');
      return;
    }
    setSubmitting(true);
    try {
      // Si es programa de materia, incluimos el nombre en el motivo
      let motivoFinal = motivo || undefined;
      if (esProgramaMateria && materiaId) {
        const mat = materias.data?.items.find((m) => m.id === materiaId);
        const refMateria = mat ? `Programa de: ${mat.nombre} (${mat.codigo})` : '';
        motivoFinal = motivo ? `${refMateria} — ${motivo}` : refMateria;
      }
      await constanciasApi.create({ alumnoId, tipo, motivo: motivoFinal });
      onCreada();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo crear la solicitud'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-serif text-xl font-semibold text-navy-900">Nueva constancia</h3>
        <p className="text-sm text-slate-500 mb-4">
          Tu solicitud quedará pendiente. El personal administrativo la procesa en{' '}
          <strong className="text-slate-700">2 a 5 días hábiles</strong>. Recibirás la
          constancia disponible para descargar una vez emitida.
        </p>
        {error && <div className="mb-3"><ErrorAlert message={error} /></div>}
        <div className="space-y-3">
          <div>
            <label className="form-label">Tipo de constancia</label>
            <select
              value={tipo}
              onChange={(e) => handleTipoChange(e.target.value as TipoConstancia)}
              className="form-input"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {/* Descripción del tipo seleccionado */}
            {(() => {
              const desc = TIPOS.find((t) => t.value === tipo)?.descripcion;
              return desc ? (
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{desc}</p>
              ) : null;
            })()}
          </div>

          {/* Selector de materia: solo para PROGRAMA_MATERIA */}
          {esProgramaMateria && (
            <div>
              <label className="form-label">Materia <span className="text-red-500">*</span></label>
              {materias.loading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                  <Spinner size={14} /> Cargando materias…
                </div>
              ) : (
                <select
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Seleccioná una materia…</option>
                  {(materias.data?.items ?? [])
                    .sort((a, b) => a.anio - b.anio || a.nombre.localeCompare(b.nombre))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.anio}° año · {m.nombre} ({m.codigo})
                      </option>
                    ))}
                </select>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Indicá a qué materia corresponde el programa solicitado.
              </p>
            </div>
          )}

          <div>
            <label className="form-label">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Ej.: trámite bancario, presentación laboral…"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || (esProgramaMateria && !materiaId)}>
            {submitting ? <Spinner size={16} className="text-white" /> : 'Solicitar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
