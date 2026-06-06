import { useMemo, useState } from 'react';
import {
  UserPlus,
  Copy,
  Check,
  Search,
  Pencil,
  KeyRound,
  UserCheck,
  UserX,
  ShieldAlert,
  History,
  LogIn,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { usuariosApi, type CreateAlumnoPayload, type CreateStaffPayload } from '../api/usuarios.api';
import { auditoriaApi } from '../api/auditoria.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner, FullPageLoader } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import { getIniciales, tiempoRelativo } from '../utils/format';
import type { RolUsuario, Usuario } from '../types';

const CARRERAS = [
  'Tecnicatura Superior en Enfermería',
  'Tecnicatura Superior en Laboratorio de Análisis Clínicos',
];

type Tab = 'alumnos' | 'staff' | 'actividad';

const ROL_TONE: Record<RolUsuario, 'success' | 'info' | 'navy' | 'danger'> = {
  SUPERADMIN: 'danger',
  ADMINISTRACION: 'info',
  DOCENTE: 'navy',
  ALUMNO: 'success',
};

const ROL_LABEL: Record<RolUsuario, string> = {
  SUPERADMIN: 'Superadmin',
  ADMINISTRACION: 'Administración',
  DOCENTE: 'Docente',
  ALUMNO: 'Alumno',
};

export function GestionUsuariosPage() {
  const { usuario } = useAuth();
  const isSuperadmin = usuario?.rol === 'SUPERADMIN';
  const isStaff = isSuperadmin || usuario?.rol === 'ADMINISTRACION';

  const [tab, setTab] = useState<Tab>('alumnos');
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [modalTipo, setModalTipo] = useState<'alumno' | 'staff' | null>(null);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [credenciales, setCredenciales] = useState<{
    titulo: string;
    email?: string;
    password: string;
  } | null>(null);

  const usuarios = useApi(() => usuariosApi.list({ pageSize: 100 }), []);

  const lista = useMemo(() => usuarios.data?.items ?? [], [usuarios.data]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return lista.filter((u) => {
      if (estado === 'activos' && u.activo === false) return false;
      if (estado === 'inactivos' && u.activo !== false) return false;
      if (!term) return true;
      return (
        u.nombre.toLowerCase().includes(term) ||
        u.apellido.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [lista, q, estado]);

  if (usuarios.loading) return <FullPageLoader />;

  const alumnos = filtrados.filter((u) => u.rol === 'ALUMNO');
  const staff = filtrados.filter((u) => u.rol !== 'ALUMNO');

  const total = lista.length;
  const activos = lista.filter((u) => u.activo !== false).length;
  const totalAlumnos = lista.filter((u) => u.rol === 'ALUMNO').length;
  const totalStaff = total - totalAlumnos;

  async function toggleActivo(u: Usuario) {
    try {
      if (u.activo === false) await usuariosApi.reactivate(u.id);
      else await usuariosApi.deactivate(u.id);
      usuarios.reload();
    } catch (err) {
      alert(extractErrorMessage(err, 'No se pudo cambiar el estado'));
    }
  }

  async function resetPassword(u: Usuario) {
    if (!confirm(`¿Restablecer la contraseña de ${u.nombre} ${u.apellido}?`)) return;
    try {
      const r = await usuariosApi.resetPassword(u.id);
      setCredenciales({ titulo: 'Contraseña restablecida', email: u.email, password: r.passwordTemporal });
    } catch (err) {
      alert(extractErrorMessage(err, 'No se pudo restablecer la contraseña'));
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Gestión de usuarios' }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Gestión de usuarios</h1>
          <p className="text-sm text-slate-500">Administrá cuentas, roles y actividad</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalTipo('alumno')} leftIcon={<UserPlus size={16} />}>
            Nuevo alumno
          </Button>
          {isStaff && (
            <Button
              variant="secondary"
              onClick={() => setModalTipo('staff')}
              leftIcon={<UserPlus size={16} />}
            >
              Nuevo staff
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Usuarios totales" value={total} />
        <StatCard label="Activos" value={activos} tone="emerald" />
        <StatCard label="Alumnos" value={totalAlumnos} />
        <StatCard label="Staff y docentes" value={totalStaff} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {(['alumnos', 'staff', 'actividad'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-navy-700 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t === 'alumnos'
              ? `Alumnos (${alumnos.length})`
              : t === 'staff'
                ? `Staff (${staff.length})`
                : 'Registro de actividad'}
          </button>
        ))}
      </div>

      {tab === 'actividad' ? (
        <AuditPanel />
      ) : (
        <>
          {/* Filtros */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="form-input pl-9"
              />
            </div>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as typeof estado)}
              className="form-input sm:max-w-[12rem]"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
            </select>
          </div>

          <Card padding="none" className="overflow-hidden">
            <TablaUsuarios
              items={tab === 'alumnos' ? alumnos : staff}
              currentUserId={usuario?.id}
              canManage={isStaff}
              isSuperadmin={isSuperadmin}
              onEdit={setEditando}
              onToggle={toggleActivo}
              onReset={resetPassword}
            />
          </Card>
        </>
      )}

      {/* Modales */}
      {credenciales && (
        <ModalCredenciales
          titulo={credenciales.titulo}
          email={credenciales.email}
          password={credenciales.password}
          onClose={() => setCredenciales(null)}
        />
      )}

      {editando && (
        <ModalEditarUsuario
          usuario={editando}
          isSuperadmin={isSuperadmin}
          onClose={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            usuarios.reload();
          }}
        />
      )}

      {modalTipo === 'alumno' && (
        <ModalCrearAlumno
          onClose={() => setModalTipo(null)}
          onCreado={(email, password) => {
            setModalTipo(null);
            setCredenciales({ titulo: 'Alumno creado', email, password });
            usuarios.reload();
          }}
        />
      )}

      {modalTipo === 'staff' && (
        <ModalCrearStaff
          onClose={() => setModalTipo(null)}
          onCreado={(email, password) => {
            setModalTipo(null);
            setCredenciales({ titulo: 'Usuario creado', email, password });
            usuarios.reload();
          }}
        />
      )}
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'emerald' }) {
  return (
    <Card>
      <p className={`font-serif text-2xl font-bold ${tone === 'emerald' ? 'text-emerald-600' : 'text-navy-900'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </Card>
  );
}

// ── Tabla de usuarios ─────────────────────────────────────────────────────────

function TablaUsuarios({
  items,
  currentUserId,
  canManage,
  isSuperadmin,
  onEdit,
  onToggle,
  onReset,
}: {
  items: Usuario[];
  currentUserId?: string;
  canManage: boolean;
  isSuperadmin: boolean;
  onEdit: (u: Usuario) => void;
  onToggle: (u: Usuario) => void;
  onReset: (u: Usuario) => void;
}) {
  if (!items.length) {
    return (
      <p className="py-10 text-center text-sm italic text-slate-500">
        No hay usuarios que coincidan.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/60 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Usuario</th>
            <th className="px-4 py-2.5 text-left font-medium">Rol</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            <th className="px-4 py-2.5 text-left font-medium">Última conexión</th>
            {canManage && <th className="px-4 py-2.5 text-right font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((u) => {
            const puedeGestionar = isSuperadmin || u.rol !== 'SUPERADMIN';
            const esYo = u.id === currentUserId;
            const activo = u.activo !== false;
            return (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-900">
                        {getIniciales(u.nombre, u.apellido)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {u.apellido}, {u.nombre} {esYo && <span className="text-xs text-slate-400">(vos)</span>}
                      </p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={ROL_TONE[u.rol]}>{ROL_LABEL[u.rol]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={activo ? 'success' : 'neutral'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{tiempoRelativo(u.ultimoLogin)}</td>
                {canManage && (
                  <td className="px-4 py-3">
                    {puedeGestionar ? (
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Editar" onClick={() => onEdit(u)}>
                          <Pencil size={15} />
                        </IconBtn>
                        <IconBtn title="Restablecer contraseña" onClick={() => onReset(u)}>
                          <KeyRound size={15} />
                        </IconBtn>
                        {!esYo &&
                          (activo ? (
                            <IconBtn title="Desactivar" danger onClick={() => onToggle(u)}>
                              <UserX size={15} />
                            </IconBtn>
                          ) : (
                            <IconBtn title="Reactivar" onClick={() => onToggle(u)}>
                              <UserCheck size={15} />
                            </IconBtn>
                          ))}
                      </div>
                    ) : (
                      <p className="text-right text-xs text-slate-300">—</p>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors ${
        danger
          ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-400 hover:bg-slate-100 hover:text-navy-700'
      }`}
    >
      {children}
    </button>
  );
}

// ── Panel de actividad (auditoría) ─────────────────────────────────────────────

const ACCION_META: Record<
  string,
  { label: string; chip: string; icon: typeof History }
> = {
  USER_CREATED: { label: 'Alta', chip: 'bg-emerald-100 text-emerald-700', icon: UserPlus },
  USER_UPDATED: { label: 'Edición', chip: 'bg-sky-100 text-sky-700', icon: Pencil },
  USER_ROLE_CHANGED: { label: 'Cambio de rol', chip: 'bg-amber-100 text-amber-700', icon: ShieldAlert },
  USER_DEACTIVATED: { label: 'Baja', chip: 'bg-rose-100 text-rose-700', icon: UserX },
  USER_REACTIVATED: { label: 'Reactivación', chip: 'bg-emerald-100 text-emerald-700', icon: UserCheck },
  PASSWORD_RESET: { label: 'Reset contraseña', chip: 'bg-violet-100 text-violet-700', icon: KeyRound },
  LOGIN: { label: 'Inicio de sesión', chip: 'bg-slate-100 text-slate-600', icon: LogIn },
};

function AuditPanel() {
  const [q, setQ] = useState('');
  const logs = useApi(() => auditoriaApi.list({ q: q || undefined, pageSize: 80 }), [q]);

  return (
    <Card>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en el registro (usuario, acción…)"
          className="form-input pl-9"
        />
      </div>

      {logs.loading ? (
        <div className="py-10">
          <Spinner className="mx-auto" />
        </div>
      ) : logs.error ? (
        <ErrorAlert message={logs.error} />
      ) : !logs.data?.items.length ? (
        <p className="py-10 text-center text-sm italic text-slate-500">Sin registros de actividad.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {logs.data.items.map((l) => {
            const meta = ACCION_META[l.accion] ?? {
              label: l.accion,
              chip: 'bg-slate-100 text-slate-600',
              icon: History,
            };
            const Icon = meta.icon;
            return (
              <li key={l.id} className="flex items-start gap-3 py-3">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{l.descripcion}</span>
                    {l.targetNombre && <span className="text-slate-500"> · {l.targetNombre}</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {l.actorEmail ?? 'Sistema'} · {tiempoRelativo(l.creadoEn)}
                    {l.ip ? ` · ${l.ip}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ── Modal: editar usuario ──────────────────────────────────────────────────────

function ModalEditarUsuario({
  usuario,
  isSuperadmin,
  onClose,
  onGuardado,
}: {
  usuario: Usuario;
  isSuperadmin: boolean;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [apellido, setApellido] = useState(usuario.apellido);
  const [rol, setRol] = useState<RolUsuario>(usuario.rol);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esAlumno = usuario.rol === 'ALUMNO';

  async function guardar() {
    if (nombre.trim().length < 2 || apellido.trim().length < 2) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await usuariosApi.update(usuario.id, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        ...(esAlumno ? {} : { rol }),
      });
      onGuardado();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo guardar'));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar usuario"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={submitting} leftIcon={submitting ? <Spinner size={16} /> : undefined}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <ErrorAlert message={error} />}
        <p className="text-sm text-slate-500">{usuario.email}</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input label="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Rol</label>
          {esAlumno ? (
            <Input value="Alumno (no editable)" disabled readOnly />
          ) : (
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolUsuario)}
              className="form-input"
            >
              <option value="DOCENTE">Docente</option>
              <option value="ADMINISTRACION">Administración</option>
              {isSuperadmin && <option value="SUPERADMIN">Superadmin</option>}
            </select>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Modal credenciales ────────────────────────────────────────────────────────

function ModalCredenciales({
  titulo,
  email,
  password,
  onClose,
}: {
  titulo: string;
  email?: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copiar() {
    const txt = email ? `Email: ${email}\nContraseña: ${password}` : `Contraseña: ${password}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 font-serif text-xl font-semibold text-navy-900">{titulo}</h3>
        <p className="mb-4 text-sm text-slate-500">
          Compartí estas credenciales con el usuario. La contraseña no se podrá ver de nuevo.
        </p>

        <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-4">
          {email && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Email</p>
              <p className="font-medium text-slate-900">{email}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Contraseña temporal</p>
            <p className="font-mono text-lg font-semibold text-navy-900">{password}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={copiar} leftIcon={copied ? <Check size={16} /> : <Copy size={16} />} variant="secondary">
            {copied ? 'Copiado' : 'Copiar'}
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
    const { nombre, apellido, email, dni, carrera, anioIngreso, fechaNacimiento } = form;
    if (!nombre || !apellido || !email || !dni || !carrera || !anioIngreso || !fechaNacimiento) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-6">
      <div className="my-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 font-serif text-xl font-semibold text-navy-900">Nuevo alumno</h3>
        <p className="mb-4 text-sm text-slate-500">Se generará una contraseña temporal automáticamente.</p>

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
            <label className="form-label">Legajo</label>
            <Input value="Se genera automáticamente" disabled readOnly />
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

        <div className="mt-6 flex justify-end gap-2">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 font-serif text-xl font-semibold text-navy-900">Nuevo usuario de staff</h3>
        <p className="mb-4 text-sm text-slate-500">Se generará una contraseña temporal automáticamente.</p>

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
              <option value="ADMINISTRACION">Administración</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size={16} className="text-white" /> : 'Crear usuario'}
          </Button>
        </div>
      </div>
    </div>
  );
}
