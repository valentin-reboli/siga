import { useState } from 'react';
import { UserPlus, Copy, Check, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { usuariosApi, type CreateAlumnoPayload, type CreateStaffPayload } from '../api/usuarios.api';
import { materiasApi } from '../api/materias.api';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import type { RolUsuario } from '../types';

const CARRERAS = [
  'Tecnicatura Superior en Enfermería',
  'Tecnicatura Superior en Laboratorio de Análisis Clínicos',
];

type Tab = 'alumnos' | 'staff';

export function GestionUsuariosPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'ADMIN';
  const [tab, setTab] = useState<Tab>('alumnos');
  const [modalTipo, setModalTipo] = useState<'alumno' | 'staff' | null>(null);
  const [credenciales, setCredenciales] = useState<{ email: string; password: string } | null>(null);

  const usuarios = useApi(
    () => usuariosApi.list({ pageSize: 50 }),
    [],
  );

  if (usuarios.loading) return <FullPageLoader />;

  const alumnos = usuarios.data?.items.filter((u) => u.rol === 'ALUMNO') ?? [];
  const staff = usuarios.data?.items.filter((u) => u.rol !== 'ALUMNO') ?? [];

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Gestión de usuarios' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Gestión de usuarios</h1>
          <p className="text-sm text-slate-500">
            Crear y administrar alumnos, docentes y personal
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalTipo('alumno')} leftIcon={<UserPlus size={16} />}>
            Nuevo alumno
          </Button>
          {isAdmin && (
            <Button variant="secondary" onClick={() => setModalTipo('staff')} leftIcon={<UserPlus size={16} />}>
              Nuevo staff
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {(['alumnos', 'staff'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-navy-700 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t === 'alumnos' ? `Alumnos (${alumnos.length})` : `Staff (${staff.length})`}
          </button>
        ))}
      </div>

      <Card>
        {tab === 'alumnos' ? (
          <TablaUsuarios
            items={alumnos}
            onDeactivate={isAdmin ? async (id) => { await usuariosApi.deactivate(id); usuarios.reload(); } : undefined}
          />
        ) : (
          <TablaUsuarios
            items={staff}
            showMaterias={isAdmin}
            onDeactivate={isAdmin ? async (id) => { await usuariosApi.deactivate(id); usuarios.reload(); } : undefined}
          />
        )}
      </Card>

      {/* Credenciales generadas */}
      {credenciales && (
        <ModalCredenciales
          email={credenciales.email}
          password={credenciales.password}
          onClose={() => setCredenciales(null)}
        />
      )}

      {/* Modal crear alumno */}
      {modalTipo === 'alumno' && (
        <ModalCrearAlumno
          onClose={() => setModalTipo(null)}
          onCreado={(email, password) => {
            setModalTipo(null);
            setCredenciales({ email, password });
            usuarios.reload();
          }}
        />
      )}

      {/* Modal crear staff */}
      {modalTipo === 'staff' && (
        <ModalCrearStaff
          onClose={() => setModalTipo(null)}
          onCreado={(email, password) => {
            setModalTipo(null);
            setCredenciales({ email, password });
            usuarios.reload();
          }}
        />
      )}
    </div>
  );
}

// ── Tabla de usuarios ─────────────────────────────────────────────────────────

function TablaUsuarios({
  items,
  showMaterias,
  onDeactivate,
}: {
  items: Array<{ id: string; nombre: string; apellido: string; email: string; rol: RolUsuario; activo?: boolean }>;
  showMaterias?: boolean;
  onDeactivate?: (id: string) => Promise<void>;
}) {
  const rolColor: Record<RolUsuario, 'success' | 'info' | 'navy' | 'warn' | 'neutral'> = {
    ADMIN: 'danger' as any,
    ADMINISTRATIVO: 'info',
    DOCENTE: 'navy',
    PRECEPTOR: 'warn',
    ALUMNO: 'success',
  };

  if (!items.length) {
    return <p className="text-sm text-slate-500 italic py-6 text-center">No hay usuarios en esta categoría.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
          <tr>
            <th className="text-left py-2 px-2 font-medium">Nombre</th>
            <th className="text-left py-2 px-2 font-medium">Email</th>
            <th className="text-left py-2 px-2 font-medium">Rol</th>
            <th className="text-left py-2 px-2 font-medium">Estado</th>
            {onDeactivate && <th className="text-right py-2 px-2 font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="py-3 px-2 font-medium text-slate-900">
                {u.apellido}, {u.nombre}
              </td>
              <td className="py-3 px-2 text-slate-600">{u.email}</td>
              <td className="py-3 px-2">
                <Badge tone={rolColor[u.rol]}>{u.rol}</Badge>
              </td>
              <td className="py-3 px-2">
                <Badge tone={u.activo !== false ? 'success' : 'neutral'}>
                  {u.activo !== false ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              {onDeactivate && (
                <td className="py-3 px-2 text-right">
                  {u.activo !== false && (
                    <button
                      onClick={() => onDeactivate(u.id)}
                      className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 ml-auto"
                    >
                      <X size={14} /> Desactivar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal credenciales ────────────────────────────────────────────────────────

function ModalCredenciales({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copiar() {
    navigator.clipboard.writeText(`Email: ${email}\nContraseña: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-serif text-xl font-semibold text-navy-900 mb-1">Usuario creado</h3>
        <p className="text-sm text-slate-500 mb-4">
          Compartí estas credenciales con el usuario. La contraseña no se podrá ver de nuevo.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
            <p className="font-medium text-slate-900">{email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Contraseña temporal</p>
            <p className="font-mono text-lg font-semibold text-navy-900">{password}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={copiar} leftIcon={copied ? <Check size={16} /> : <Copy size={16} />} variant="secondary">
            {copied ? 'Copiado' : 'Copiar credenciales'}
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal crear alumno ────────────────────────────────────────────────────────

function ModalCrearAlumno({ onClose, onCreado }: { onClose: () => void; onCreado: (email: string, password: string) => void }) {
  const [form, setForm] = useState<Partial<CreateAlumnoPayload>>({ anioIngreso: new Date().getFullYear() });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof CreateAlumnoPayload, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setError(null);
    const { nombre, apellido, email, dni, legajo, carrera, anioIngreso, fechaNacimiento } = form;
    if (!nombre || !apellido || !email || !dni || !legajo || !carrera || !anioIngreso || !fechaNacimiento) {
      setError('Completá todos los campos obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const result = await usuariosApi.createAlumno(form as CreateAlumnoPayload);
      onCreado(email, result.passwordTemporal);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo crear el alumno'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-4">
        <h3 className="font-serif text-xl font-semibold text-navy-900 mb-1">Nuevo alumno</h3>
        <p className="text-sm text-slate-500 mb-4">Se generará una contraseña temporal automáticamente.</p>

        {error && <div className="mb-3"><ErrorAlert message={error} /></div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Nombre *</label>
            <Input value={form.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} placeholder="Juan" />
          </div>
          <div>
            <label className="form-label">Apellido *</label>
            <Input value={form.apellido ?? ''} onChange={(e) => set('apellido', e.target.value)} placeholder="Pérez" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Email institucional *</label>
            <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="jperez@iscr.edu.ar" />
          </div>
          <div>
            <label className="form-label">DNI *</label>
            <Input value={form.dni ?? ''} onChange={(e) => set('dni', e.target.value)} placeholder="40123456" />
          </div>
          <div>
            <label className="form-label">Legajo *</label>
            <Input value={form.legajo ?? ''} onChange={(e) => set('legajo', e.target.value)} placeholder="ENF-2026-001" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Carrera *</label>
            <select value={form.carrera ?? ''} onChange={(e) => set('carrera', e.target.value)} className="form-input">
              <option value="">Seleccioná una carrera…</option>
              {CARRERAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Año de ingreso *</label>
            <Input type="number" value={form.anioIngreso ?? ''} onChange={(e) => set('anioIngreso', Number(e.target.value))} placeholder="2026" />
          </div>
          <div>
            <label className="form-label">Fecha de nacimiento *</label>
            <Input type="date" value={form.fechaNacimiento ?? ''} onChange={(e) => set('fechaNacimiento', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Teléfono</label>
            <Input value={form.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} placeholder="+54 345 4…" />
          </div>
          <div>
            <label className="form-label">Dirección</label>
            <Input value={form.direccion ?? ''} onChange={(e) => set('direccion', e.target.value)} placeholder="Av. …" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size={16} className="text-white" /> : 'Crear alumno'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal crear staff ─────────────────────────────────────────────────────────

function ModalCrearStaff({ onClose, onCreado }: { onClose: () => void; onCreado: (email: string, password: string) => void }) {
  const [form, setForm] = useState<Partial<CreateStaffPayload>>({ rol: 'DOCENTE' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof CreateStaffPayload, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setError(null);
    const { nombre, apellido, email, rol } = form;
    if (!nombre || !apellido || !email || !rol) { setError('Completá todos los campos'); return; }
    setSubmitting(true);
    try {
      const result = await usuariosApi.createStaff(form as CreateStaffPayload);
      onCreado(email, result.passwordTemporal);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo crear el usuario'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-serif text-xl font-semibold text-navy-900 mb-1">Nuevo usuario de staff</h3>
        <p className="text-sm text-slate-500 mb-4">Se generará una contraseña temporal automáticamente.</p>

        {error && <div className="mb-3"><ErrorAlert message={error} /></div>}

        <div className="space-y-3">
          <div>
            <label className="form-label">Nombre *</label>
            <Input value={form.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} placeholder="Laura" />
          </div>
          <div>
            <label className="form-label">Apellido *</label>
            <Input value={form.apellido ?? ''} onChange={(e) => set('apellido', e.target.value)} placeholder="Ramírez" />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="lramirez@iscr.edu.ar" />
          </div>
          <div>
            <label className="form-label">Rol *</label>
            <select value={form.rol ?? 'DOCENTE'} onChange={(e) => set('rol', e.target.value)} className="form-input">
              <option value="DOCENTE">Docente</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="PRECEPTOR">Preceptor</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size={16} className="text-white" /> : 'Crear usuario'}
          </Button>
        </div>
      </div>
    </div>
  );
}
