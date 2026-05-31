import { useState } from 'react';
import { Plus, Download, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { alumnosApi } from '../api/alumnos.api';
import { constanciasApi } from '../api/constancias.api';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import type { TipoConstancia, EstadoConstancia, Constancia } from '../types';

const TIPOS: { value: TipoConstancia; label: string }[] = [
  { value: 'ALUMNO_REGULAR', label: 'Constancia de alumno regular' },
  { value: 'ANALITICO_PARCIAL', label: 'Analítico parcial' },
  { value: 'ANALITICO_FINAL', label: 'Analítico final' },
  { value: 'EXAMEN_FINAL', label: 'Constancia de examen final' },
  { value: 'TITULO_EN_TRAMITE', label: 'Título en trámite' },
  { value: 'PROGRAMA_MATERIA', label: 'Programa de materia' },
];

export function ConstanciasPage() {
  const alumno = useApi(() => alumnosApi.me(), []);
  const constancias = useApi(() => constanciasApi.list({ pageSize: 50 }), []);
  const [modalAbierto, setModalAbierto] = useState(false);

  if (alumno.loading || constancias.loading) return <FullPageLoader />;
  if (alumno.error) return <ErrorAlert message={alumno.error} />;
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
              <ItemConstancia key={c.id} constancia={c} />
            ))}
          </ul>
        )}
      </Card>

      {modalAbierto && (
        <ModalNuevaConstancia
          alumnoId={alumno.data.id}
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

function ItemConstancia({ constancia }: { constancia: Constancia }) {
  const [bajando, setBajando] = useState(false);
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

  return (
    <li className="flex items-center justify-between py-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-slate-900">{label}</h4>
          <EstadoConstanciaChip estado={constancia.estado} />
        </div>
        <p className="text-xs text-slate-500">
          Solicitada el {formatDate(constancia.fechaSolicitud)}
          {constancia.fechaEmision && ` · Emitida el ${formatDate(constancia.fechaEmision)}`}
        </p>
        <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
          <ShieldCheck size={12} /> Código de verificación:{' '}
          <code className="font-mono text-slate-700">{constancia.codigoVerificacion}</code>
        </p>
      </div>
      {constancia.estado === 'EMITIDA' ? (
        <Button variant="secondary" onClick={descargar} disabled={bajando} leftIcon={<Download size={14} />}>
          {bajando ? <Spinner size={14} /> : 'Descargar PDF'}
        </Button>
      ) : (
        <span className="text-xs text-slate-400 italic">Pendiente de emisión</span>
      )}
    </li>
  );
}

function EstadoConstanciaChip({ estado }: { estado: EstadoConstancia }) {
  const map: Record<EstadoConstancia, 'success' | 'warn' | 'danger' | 'neutral'> = {
    EMITIDA: 'success',
    EN_PROCESO: 'warn',
    SOLICITADA: 'neutral',
    RECHAZADA: 'danger',
  };
  return <Badge tone={map[estado]}>{estado.replace('_', ' ').toLowerCase()}</Badge>;
}

interface ModalProps {
  alumnoId: string;
  onClose: () => void;
  onCreada: () => void;
}

function ModalNuevaConstancia({ alumnoId, onClose, onCreada }: ModalProps) {
  const [tipo, setTipo] = useState<TipoConstancia>('ALUMNO_REGULAR');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await constanciasApi.create({ alumnoId, tipo, motivo: motivo || undefined });
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
          Tu solicitud quedará pendiente de aprobación administrativa.
        </p>

        {error && (
          <div className="mb-3">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="form-label">Tipo de constancia</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoConstancia)}
              className="form-input"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

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
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size={16} className="text-white" /> : 'Solicitar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
