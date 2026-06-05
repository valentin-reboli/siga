import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Paperclip,
  Pin,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { foroApi, type NuevaPublicacion } from '../api/foro.api';
import { extractErrorMessage } from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { colorMateria, getIniciales } from '../utils/format';
import type {
  AutorMini,
  Comentario,
  Publicacion,
  PublicacionDetalle,
  TipoPublicacion,
} from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────

const TIPOS: Record<
  TipoPublicacion,
  { label: string; tone: 'navy' | 'info' | 'success'; icon: typeof Megaphone }
> = {
  ANUNCIO: { label: 'Anuncio', tone: 'navy', icon: Megaphone },
  MATERIAL: { label: 'Material', tone: 'success', icon: FileText },
  HILO: { label: 'Discusión', tone: 'info', icon: MessagesSquare },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function rolLabel(rol: AutorMini['rol']): string {
  if (rol === 'DOCENTE') return 'Docente';
  if (rol === 'SUPERADMIN' || rol === 'ADMINISTRACION') return 'Gestión';
  return 'Alumno';
}

// ── Página principal ────────────────────────────────────────────────────────

export function MateriaForoPage() {
  const { materiaId = '' } = useParams();
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState<TipoPublicacion | ''>('');
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const feed = useApi(
    () => foroApi.feed(materiaId, { tipo: filtro || undefined, pageSize: 100 }),
    [materiaId, filtro],
  );

  if (feed.loading) return <FullPageLoader label="Cargando foro…" />;
  if (feed.error) {
    return (
      <div className="max-w-screen-lg mx-auto">
        <ErrorAlert message={feed.error} />
      </div>
    );
  }

  const data = feed.data!;
  const color = colorMateria(data.materia.codigo);
  const puedePublicar = data.puedePublicar;

  return (
    <div className="max-w-screen-lg mx-auto">
      <Breadcrumb
        items={[
          { label: 'SIGA', to: '/' },
          { label: 'Catálogo de materias', to: '/materias' },
          { label: data.materia.nombre },
        ]}
      />

      {/* Cabecera de la materia */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 mb-6 text-white"
        style={{ background: `linear-gradient(135deg, ${color.bg}, ${color.accent})` }}
      >
        <Link
          to="/materias"
          className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white mb-3"
        >
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl font-semibold">{data.materia.nombre}</h1>
            <p className="text-white/80 text-sm mt-1">
              {data.materia.codigo} · {data.materia.carrera} · {data.materia.anio}° año
            </p>
          </div>
          {puedePublicar && (
            <Button
              variant="secondary"
              className="bg-white shadow-sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setNuevoOpen(true)}
            >
              Nueva publicación
            </Button>
          )}
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FiltroChip activo={filtro === ''} onClick={() => setFiltro('')}>
          Todo
        </FiltroChip>
        {(Object.keys(TIPOS) as TipoPublicacion[]).map((t) => (
          <FiltroChip key={t} activo={filtro === t} onClick={() => setFiltro(t)}>
            {TIPOS[t].label}
          </FiltroChip>
        ))}
      </div>

      {/* Feed */}
      {data.items.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <MessageSquare size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Todavía no hay publicaciones en esta materia.</p>
            {puedePublicar && (
              <p className="text-xs text-slate-400 mt-1">
                Creá la primera con “Nueva publicación”.
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((p) => (
            <PublicacionItem key={p.id} pub={p} onOpen={() => setDetalleId(p.id)} />
          ))}
        </div>
      )}

      {/* Modal: nueva publicación */}
      {nuevoOpen && (
        <NuevaPublicacionModal
          materiaId={materiaId}
          onClose={() => setNuevoOpen(false)}
          onCreated={() => {
            setNuevoOpen(false);
            feed.reload();
          }}
        />
      )}

      {/* Modal: detalle de publicación */}
      {detalleId && (
        <PublicacionDetalleModal
          id={detalleId}
          currentUserId={usuario?.id ?? ''}
          onClose={() => setDetalleId(null)}
          onChanged={() => feed.reload()}
        />
      )}
    </div>
  );
}

// ── Chip de filtro ──────────────────────────────────────────────────────────

function FiltroChip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        activo
          ? 'bg-navy-900 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

// ── Item del feed ─────────────────────────────────────────────────────────

function PublicacionItem({ pub, onOpen }: { pub: Publicacion; onOpen: () => void }) {
  const meta = TIPOS[pub.tipo];
  const Icon = meta.icon;
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left">
      <Card className="transition-shadow hover:shadow-card">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-lg bg-slate-100 p-2 text-slate-500">
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {pub.fijado && (
                <Badge tone="warn">
                  <Pin size={11} /> Fijado
                </Badge>
              )}
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <h4 className="font-semibold text-slate-900 truncate">{pub.titulo}</h4>
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm text-slate-600 whitespace-pre-wrap">
              {pub.contenido}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>
                {pub.autor.nombre} {pub.autor.apellido} · {formatDateTime(pub.creadoEn)}
              </span>
              {pub.adjuntos.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip size={12} /> {pub.adjuntos.length}
                </span>
              )}
              {pub._count && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={12} /> {pub._count.comentarios}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}

// ── Modal: crear publicación ────────────────────────────────────────────────

function NuevaPublicacionModal({
  materiaId,
  onClose,
  onCreated,
}: {
  materiaId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [tipo, setTipo] = useState<TipoPublicacion>('ANUNCIO');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [fijado, setFijado] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (titulo.trim().length < 2 || contenido.trim().length < 1) {
      setError('Completá el título y el contenido.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: NuevaPublicacion = { tipo, titulo, contenido, fijado, archivos };
      await foroApi.crearPublicacion(materiaId, payload);
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo crear la publicación'));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva publicación"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={submitting} leftIcon={submitting ? <Spinner size={16} /> : undefined}>
            Publicar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <ErrorAlert message={error} />}

        <div>
          <label className="form-label">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIPOS) as TipoPublicacion[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  tipo === t
                    ? 'border-navy-900 bg-navy-50 text-navy-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {TIPOS[t].label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Guía de TP N°1"
          maxLength={200}
        />

        <div>
          <label className="form-label">Contenido</label>
          <textarea
            className="form-input min-h-[140px] resize-y"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribí el anuncio, la consigna o la descripción del material…"
            maxLength={20000}
          />
        </div>

        <div>
          <label className="form-label">Archivos adjuntos (opcional)</label>
          <input
            type="file"
            multiple
            onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {archivos.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              {archivos.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Paperclip size={12} /> {f.name} ({formatBytes(f.size)})
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-slate-400">
            PDF, imágenes, Word, Excel, PowerPoint, ZIP o TXT. Hasta 20 MB por archivo.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={fijado}
            onChange={(e) => setFijado(e.target.checked)}
            className="rounded border-slate-300"
          />
          Fijar arriba del foro
        </label>
      </div>
    </Modal>
  );
}

// ── Modal: detalle de publicación ────────────────────────────────────────────

function PublicacionDetalleModal({
  id,
  currentUserId,
  onClose,
  onChanged,
}: {
  id: string;
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const detalle = useApi<PublicacionDetalle>(() => foroApi.getPublicacion(id), [id]);

  return (
    <Modal open onClose={onClose} size="xl" title={detalle.data?.titulo ?? 'Publicación'}>
      {detalle.loading ? (
        <div className="py-10">
          <Spinner className="mx-auto" />
        </div>
      ) : detalle.error || !detalle.data ? (
        <ErrorAlert message={detalle.error ?? 'No se pudo cargar la publicación'} />
      ) : (
        <DetalleContenido
          pub={detalle.data}
          currentUserId={currentUserId}
          reload={detalle.reload}
          onDeleted={() => {
            onChanged();
            onClose();
          }}
          onChanged={onChanged}
        />
      )}
    </Modal>
  );
}

function DetalleContenido({
  pub,
  currentUserId,
  reload,
  onDeleted,
  onChanged,
}: {
  pub: PublicacionDetalle;
  currentUserId: string;
  reload: () => void;
  onDeleted: () => void;
  onChanged: () => void;
}) {
  const meta = TIPOS[pub.tipo];
  const puedeBorrarPub = pub.autor.id === currentUserId || pub.puedePublicar;
  const [borrando, setBorrando] = useState(false);

  async function borrarPub() {
    if (!confirm('¿Eliminar esta publicación y sus archivos?')) return;
    setBorrando(true);
    try {
      await foroApi.eliminarPublicacion(pub.id);
      onDeleted();
    } catch {
      setBorrando(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {pub.fijado && (
          <Badge tone="warn">
            <Pin size={11} /> Fijado
          </Badge>
        )}
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <span className="text-xs text-slate-400">{formatDateTime(pub.creadoEn)}</span>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <Avatar autor={pub.autor} />
        <span>
          {pub.autor.nombre} {pub.autor.apellido}
          <span className="ml-1 text-xs text-slate-400">· {rolLabel(pub.autor.rol)}</span>
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{pub.contenido}</p>

      {/* Adjuntos */}
      {pub.adjuntos.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Archivos
          </p>
          <ul className="space-y-2">
            {pub.adjuntos.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText size={16} className="shrink-0 text-slate-400" />
                  <span className="truncate text-sm text-slate-700">{a.nombreOriginal}</span>
                  <span className="shrink-0 text-xs text-slate-400">{formatBytes(a.tamano)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => foroApi.descargarAdjunto(a.id, a.nombreOriginal)}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-900"
                >
                  <Download size={15} /> Descargar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {puedeBorrarPub && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <Button
            variant="danger"
            leftIcon={<Trash2 size={15} />}
            onClick={borrarPub}
            disabled={borrando}
          >
            Eliminar publicación
          </Button>
        </div>
      )}

      {/* Comentarios */}
      <Comentarios
        pub={pub}
        currentUserId={currentUserId}
        reload={() => {
          reload();
          onChanged();
        }}
      />
    </div>
  );
}

function Comentarios({
  pub,
  currentUserId,
  reload,
}: {
  pub: PublicacionDetalle;
  currentUserId: string;
  reload: () => void;
}) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (texto.trim().length < 1) return;
    setEnviando(true);
    try {
      await foroApi.comentar(pub.id, texto.trim());
      setTexto('');
      reload();
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(c: Comentario) {
    if (!confirm('¿Eliminar comentario?')) return;
    await foroApi.eliminarComentario(c.id);
    reload();
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <p className="mb-3 text-sm font-semibold text-slate-700">
        Comentarios ({pub.comentarios.length})
      </p>

      {pub.comentarios.length === 0 ? (
        <p className="text-sm italic text-slate-400">Sin comentarios todavía.</p>
      ) : (
        <ul className="space-y-3">
          {pub.comentarios.map((c) => {
            const puedeBorrar = c.autor.id === currentUserId || pub.puedePublicar;
            return (
              <li key={c.id} className="flex gap-2.5">
                <Avatar autor={c.autor} />
                <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {c.autor.nombre} {c.autor.apellido}
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        · {formatDateTime(c.creadoEn)}
                      </span>
                    </span>
                    {puedeBorrar && (
                      <button
                        type="button"
                        onClick={() => borrar(c)}
                        className="text-slate-300 hover:text-danger"
                        aria-label="Eliminar comentario"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">{c.contenido}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Caja de comentario: solo para quienes pueden publicar (docente/staff) */}
      {pub.puedePublicar && (
        <div className="mt-4 flex items-end gap-2">
          <textarea
            className="form-input min-h-[44px] resize-y"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribir un comentario…"
            maxLength={5000}
          />
          <Button
            onClick={enviar}
            disabled={enviando || texto.trim().length === 0}
            leftIcon={enviando ? <Spinner size={16} /> : <Send size={16} />}
          >
            Enviar
          </Button>
        </div>
      )}
    </div>
  );
}

function Avatar({ autor }: { autor: AutorMini }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-900">
      {getIniciales(autor.nombre, autor.apellido)}
    </span>
  );
}
