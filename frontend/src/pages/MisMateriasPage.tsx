import { useState, useRef, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  X,
  BookOpen,
  Users,
  Award,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { usuariosApi } from '../api/usuarios.api';
import { inscripcionesApi } from '../api/inscripciones.api';
import { notasApi } from '../api/notas.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import type { EstadoCursada, Inscripcion, NotaParcial } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcPromedio(parciales: NotaParcial[]): number | null {
  if (!parciales.length) return null;
  const sum = parciales.reduce((a, p) => a + p.nota, 0);
  return Math.round((sum / parciales.length) * 100) / 100;
}

function formatNota(n: number | null | undefined): string {
  if (n == null) return '—';
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// Elige un estado de cursada automáticamente basándose en el promedio.
// Solo sugiere, no guarda. El docente puede sobreescribir.
function sugerirEstado(promedio: number | null, notaFinal: number | null): EstadoCursada {
  const nota = notaFinal ?? promedio;
  if (nota == null) return 'EN_CURSO';
  if (nota >= 4) return nota >= 7 ? 'APROBADA' : 'REGULAR';
  return 'REPROBADA';
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MisMateriasPage() {
  const { usuario } = useAuth();

  const misAsignaciones = useApi(
    () => (usuario ? usuariosApi.getMaterias(usuario.id) : Promise.resolve([])),
    [usuario?.id],
  );

  if (misAsignaciones.loading) return <FullPageLoader />;

  const materias: Array<{
    materiaId: string;
    materia: {
      id: string;
      codigo: string;
      nombre: string;
      anio: number;
      cuatrimestre: number;
      carrera: string;
    };
  }> = misAsignaciones.data ?? [];

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Mis materias' }]} />

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-navy-900">Mis materias</h1>
        <p className="text-sm text-slate-500">
          Cargá parciales y notas finales directamente en la tabla — sin modales, sin pasos extras.
        </p>
      </div>

      {materias.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 text-sm font-medium">Todavía no tenés materias asignadas.</p>
            <p className="text-slate-400 text-xs mt-1">Contactá al administrador.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {materias.map((dm) => (
            <MateriaCard key={dm.materiaId} materia={dm.materia} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── MateriaCard ───────────────────────────────────────────────────────────────

function MateriaCard({
  materia,
}: {
  materia: {
    id: string;
    codigo: string;
    nombre: string;
    anio: number;
    cuatrimestre: number;
    carrera: string;
  };
}) {
  const [abierta, setAbierta] = useState(false);
  const [filtro, setFiltro] = useState('');

  const inscripciones = useApi(
    () =>
      abierta
        ? inscripcionesApi.list({ materiaId: materia.id, tipo: 'CURSADA', pageSize: 200 })
        : Promise.resolve(null),
    [abierta, materia.id],
  );

  const cursadas = inscripciones.data?.items ?? [];
  const aprobadas = cursadas.filter((i) => i.estadoCursada === 'APROBADA').length;
  const regulares = cursadas.filter((i) => i.estadoCursada === 'REGULAR').length;
  const enCurso = cursadas.filter((i) => i.estadoCursada === 'EN_CURSO').length;

  const filtradas = filtro.trim()
    ? cursadas.filter((i) => {
        const q = filtro.toLowerCase();
        const nombre = `${i.alumno?.apellido ?? ''} ${i.alumno?.nombre ?? ''}`.toLowerCase();
        return nombre.includes(q) || (i.alumno?.legajo ?? '').toLowerCase().includes(q);
      })
    : cursadas;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setAbierta((v) => !v)}
        className="w-full flex items-center justify-between text-left gap-4 py-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0 ring-1 ring-teal-100">
            {materia.codigo.slice(-3)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{materia.nombre}</p>
            <p className="text-xs text-slate-500">
              {materia.codigo} · {materia.anio}° año · {materia.cuatrimestre}° cuatr. ·{' '}
              {materia.carrera}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {abierta && inscripciones.data && (
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <Users size={12} /> {cursadas.length}
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <Award size={12} /> {aprobadas} aprobados
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <TrendingUp size={12} /> {regulares} regulares
              </span>
              <span className="text-amber-600">{enCurso} en curso</span>
            </div>
          )}
          <span className="text-slate-400">
            {abierta ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        </div>
      </button>

      {/* Tabla de alumnos */}
      {abierta && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {inscripciones.loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : inscripciones.error ? (
            <ErrorAlert message={inscripciones.error} />
          ) : cursadas.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 italic">
                No hay alumnos inscriptos en cursada para esta materia.
              </p>
            </div>
          ) : (
            <>
              {/* Buscador */}
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar alumno por nombre o legajo…"
                  className="form-input py-1.5 text-sm max-w-xs"
                />
                {filtro && (
                  <button
                    onClick={() => setFiltro('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  {filtradas.length} de {cursadas.length} alumnos
                </span>
              </div>

              {/* Cabecera de columnas */}
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-48">
                        Alumno
                      </th>
                      <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Parciales
                      </th>
                      <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-20">
                        Promedio
                      </th>
                      <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-24">
                        Nota final
                      </th>
                      <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-32">
                        Estado
                      </th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtradas.map((inscripcion) => (
                      <FilaAlumno
                        key={inscripcion.id}
                        inscripcion={inscripcion}
                        onUpdated={() => inscripciones.reload()}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ── FilaAlumno ────────────────────────────────────────────────────────────────
// Cada fila maneja su propio estado local y sincroniza con el backend.

interface EditandoParcial {
  numero: number;
  tipo: string;
  nota: string; // string mientras se edita
  esNuevo: boolean;
}

function FilaAlumno({
  inscripcion,
  onUpdated,
}: {
  inscripcion: Inscripcion;
  onUpdated: () => void;
}) {
  // Estado local derivado de la inscripción (se actualiza al guardar)
  const [parciales, setParciales] = useState<NotaParcial[]>(
    () => inscripcion.notasParciales ?? [],
  );
  const [notaFinal, setNotaFinal] = useState<string>(
    inscripcion.nota != null ? String(inscripcion.nota) : '',
  );
  const [estadoCursada, setEstadoCursada] = useState<string>(
    inscripcion.estadoCursada ?? 'EN_CURSO',
  );

  // Parcial que se está editando en este momento
  const [editando, setEditando] = useState<EditandoParcial | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Guardado
  const [savingParcial, setSavingParcial] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);
  const [errorParcial, setErrorParcial] = useState<string | null>(null);
  const [errorFinal, setErrorFinal] = useState<string | null>(null);
  const [savedFinal, setSavedFinal] = useState(false);

  const promedio = calcPromedio(parciales);
  const alumnoNombre = inscripcion.alumno
    ? `${inscripcion.alumno.apellido}, ${inscripcion.alumno.nombre}`
    : '—';

  // Determina el próximo número de parcial libre
  const nextNumero = useCallback(() => {
    if (!parciales.length) return 1;
    return Math.max(...parciales.map((p) => p.numero)) + 1;
  }, [parciales]);

  // Abre el editor inline para un parcial existente
  function abrirEdicion(p: NotaParcial) {
    setEditando({ numero: p.numero, tipo: p.tipo, nota: String(p.nota), esNuevo: false });
    setErrorParcial(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  // Abre el editor inline para un parcial nuevo
  function agregarParcial() {
    setEditando({ numero: nextNumero(), tipo: 'PARCIAL', nota: '', esNuevo: true });
    setErrorParcial(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  // Guarda el parcial en edición
  async function guardarParcial() {
    if (!editando) return;
    const notaNum = parseFloat(editando.nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      setErrorParcial('Nota entre 0 y 10');
      return;
    }
    setSavingParcial(true);
    setErrorParcial(null);
    try {
      const saved = await notasApi.upsert(inscripcion.id, editando.numero, {
        tipo: editando.tipo,
        nota: notaNum,
      });
      setParciales((prev) => {
        const idx = prev.findIndex(
          (p) => p.numero === editando.numero && p.tipo === editando.tipo,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved].sort((a, b) => a.numero - b.numero || a.tipo.localeCompare(b.tipo));
      });
      setEditando(null);
    } catch (err) {
      setErrorParcial(extractErrorMessage(err, 'No se pudo guardar'));
    } finally {
      setSavingParcial(false);
    }
  }

  // Elimina un parcial
  async function eliminarParcial(p: NotaParcial) {
    try {
      await notasApi.delete(inscripcion.id, p.numero, p.tipo);
      setParciales((prev) => prev.filter((x) => !(x.numero === p.numero && x.tipo === p.tipo)));
      if (editando?.numero === p.numero && editando?.tipo === p.tipo) setEditando(null);
    } catch {
      // silencio: si falla, el chip permanece
    }
  }

  // Guarda nota final + estado de cursada
  async function guardarFinal() {
    setSavingFinal(true);
    setErrorFinal(null);
    try {
      await inscripcionesApi.update(inscripcion.id, {
        nota: notaFinal !== '' ? Number(notaFinal) : undefined,
        estadoCursada: estadoCursada as EstadoCursada,
      });
      setSavedFinal(true);
      setTimeout(() => setSavedFinal(false), 2000);
      onUpdated();
    } catch (err) {
      setErrorFinal(extractErrorMessage(err, 'No se pudo guardar'));
    } finally {
      setSavingFinal(false);
    }
  }

  // Auto-sugerir estado cuando cambia el promedio
  function handleNotaFinalChange(val: string) {
    setNotaFinal(val);
    if (val === '') {
      const sugerido = sugerirEstado(promedio, null);
      setEstadoCursada(sugerido);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setEstadoCursada(sugerirEstado(null, num));
      }
    }
  }

  const TIPOS_PARCIAL = [
    { value: 'PARCIAL', label: 'P' },
    { value: 'RECUPERATORIO', label: 'R' },
    { value: 'INTEGRACION', label: 'Int' },
  ];

  const tipoBadgeColor = (tipo: string) =>
    tipo === 'PARCIAL'
      ? 'bg-navy-100 text-navy-700'
      : tipo === 'RECUPERATORIO'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-purple-100 text-purple-700';

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors">
        {/* Alumno */}
        <td className="py-3 px-2">
          <p className="font-medium text-slate-900 text-sm leading-tight">{alumnoNombre}</p>
          <p className="text-xs text-slate-400">{inscripcion.alumno?.legajo}</p>
        </td>

        {/* Parciales: chips + editor inline */}
        <td className="py-3 px-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {parciales.map((p) =>
              editando?.numero === p.numero && editando?.tipo === p.tipo ? (
                /* Editor inline para parcial existente */
                <EditParcialInline
                  key={`edit-${p.numero}-${p.tipo}`}
                  editando={editando}
                  inputRef={editInputRef}
                  saving={savingParcial}
                  error={errorParcial}
                  tipos={TIPOS_PARCIAL}
                  onChange={(field, val) => setEditando((e) => e ? { ...e, [field]: val } : e)}
                  onSave={guardarParcial}
                  onCancel={() => setEditando(null)}
                />
              ) : (
                /* Chip del parcial */
                <button
                  key={`${p.numero}-${p.tipo}`}
                  onClick={() => abrirEdicion(p)}
                  className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${tipoBadgeColor(p.tipo)} hover:ring-2 hover:ring-offset-1 hover:ring-navy-300`}
                  title={`${p.tipo} ${p.numero} — clic para editar`}
                >
                  <span className="opacity-60 text-[10px]">{TIPOS_PARCIAL.find(t => t.value === p.tipo)?.label ?? p.tipo}{p.numero}</span>
                  <span>{formatNota(p.nota)}</span>
                  <span
                    role="button"
                    className="opacity-0 group-hover:opacity-100 ml-0.5 text-red-400 hover:text-red-600"
                    onClick={(e) => { e.stopPropagation(); eliminarParcial(p); }}
                    title="Eliminar"
                  >
                    <X size={10} />
                  </span>
                </button>
              ),
            )}

            {/* Editor para parcial nuevo */}
            {editando?.esNuevo && (
              <EditParcialInline
                key="edit-new"
                editando={editando}
                inputRef={editInputRef}
                saving={savingParcial}
                error={errorParcial}
                tipos={TIPOS_PARCIAL}
                onChange={(field, val) => setEditando((e) => e ? { ...e, [field]: val } : e)}
                onSave={guardarParcial}
                onCancel={() => setEditando(null)}
              />
            )}

            {/* Botón agregar parcial */}
            {!editando && (
              <button
                onClick={agregarParcial}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs text-slate-400 border border-dashed border-slate-300 hover:border-navy-400 hover:text-navy-600 transition-colors"
                title="Agregar parcial"
              >
                <Plus size={10} /> P{nextNumero()}
              </button>
            )}
          </div>
        </td>

        {/* Promedio */}
        <td className="py-3 px-2 text-center">
          {promedio != null ? (
            <span
              className={`font-semibold text-sm ${
                promedio >= 7
                  ? 'text-emerald-600'
                  : promedio >= 4
                  ? 'text-amber-600'
                  : 'text-red-500'
              }`}
            >
              {formatNota(promedio)}
            </span>
          ) : (
            <span className="text-slate-300 text-sm">—</span>
          )}
        </td>

        {/* Nota final */}
        <td className="py-3 px-2 text-center">
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={notaFinal}
            onChange={(e) => handleNotaFinalChange(e.target.value)}
            placeholder="—"
            className="w-16 text-center text-sm py-1 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
          />
        </td>

        {/* Estado */}
        <td className="py-3 px-2 text-center">
          <select
            value={estadoCursada}
            onChange={(e) => setEstadoCursada(e.target.value)}
            className="text-xs py-1 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
          >
            <option value="EN_CURSO">En curso</option>
            <option value="REGULAR">Regular</option>
            <option value="APROBADA">Aprobada</option>
            <option value="REPROBADA">Reprobada</option>
            <option value="LIBRE">Libre</option>
          </select>
        </td>

        {/* Guardar */}
        <td className="py-3 px-2 text-right">
          <button
            onClick={guardarFinal}
            disabled={savingFinal}
            className={`inline-flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
              savedFinal
                ? 'bg-emerald-500 text-white'
                : 'bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50'
            }`}
            title="Guardar nota final y estado"
          >
            {savingFinal ? (
              <Spinner size={12} className="text-white" />
            ) : savedFinal ? (
              <><Check size={12} /> Listo</>
            ) : (
              <><Check size={12} /> OK</>
            )}
          </button>
        </td>
      </tr>

      {/* Fila de error si hay */}
      {errorFinal && (
        <tr>
          <td colSpan={6} className="px-2 pb-2">
            <p className="text-xs text-red-600">{errorFinal}</p>
          </td>
        </tr>
      )}
    </>
  );
}

// ── EditParcialInline ─────────────────────────────────────────────────────────

function EditParcialInline({
  editando,
  inputRef,
  saving,
  error,
  tipos,
  onChange,
  onSave,
  onCancel,
}: {
  editando: { numero: number; tipo: string; nota: string; esNuevo: boolean };
  inputRef: React.RefObject<HTMLInputElement>;
  saving: boolean;
  error: string | null;
  tipos: { value: string; label: string }[];
  onChange: (field: 'nota' | 'tipo' | 'numero', val: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-navy-300 rounded-lg px-2 py-1 shadow-sm">
      {editando.esNuevo && (
        <select
          value={editando.tipo}
          onChange={(e) => onChange('tipo', e.target.value)}
          className="text-[11px] border-0 outline-none bg-transparent text-slate-600 pr-1"
        >
          {tipos.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      )}
      {editando.esNuevo && (
        <input
          type="number"
          min={1}
          max={20}
          value={editando.numero}
          onChange={(e) => onChange('numero', e.target.value)}
          className="w-7 text-[11px] text-center border-0 outline-none bg-transparent text-slate-600"
          title="Número del parcial"
        />
      )}
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={10}
        step={0.5}
        value={editando.nota}
        onChange={(e) => onChange('nota', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="0–10"
        className={`w-14 text-xs text-center border-0 outline-none bg-transparent font-semibold ${
          error ? 'text-red-500' : 'text-slate-900'
        }`}
        title={error ?? 'Nota (0–10)'}
        autoFocus
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
        title="Guardar"
      >
        {saving ? <Spinner size={12} /> : <Check size={12} />}
      </button>
      <button
        onClick={onCancel}
        className="text-slate-400 hover:text-slate-600"
        title="Cancelar"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Helpers de chips de estado ────────────────────────────────────────────────

export function EstadoCursadaChip({ estado }: { estado: EstadoCursada | null }) {
  if (!estado) return <span className="text-slate-400 text-xs">—</span>;
  const map: Record<EstadoCursada, 'success' | 'info' | 'danger' | 'warn' | 'neutral'> = {
    APROBADA: 'success',
    REGULAR: 'info',
    EN_CURSO: 'warn',
    REPROBADA: 'danger',
    LIBRE: 'neutral',
  };
  return <Badge tone={map[estado]}>{estado.replace('_', ' ')}</Badge>;
}
