import { useRef, useState } from 'react';
import {
  Camera, Trash2, Loader2, Pencil, Check, X,
  KeyRound, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { alumnosApi } from '../api/alumnos.api';
import { usuariosApi } from '../api/usuarios.api';
import { authApi } from '../api/auth.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FullPageLoader, Spinner } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { extractErrorMessage } from '../api/client';
import { formatDate, getIniciales } from '../utils/format';
import { fileToAvatarDataUrl } from '../utils/image';

export function PerfilPage() {
  const { usuario, refresh } = useAuth();
  const alumno = useApi(
    () => (usuario?.rol === 'ALUMNO' ? alumnosApi.me() : Promise.resolve(null)),
    [usuario?.id],
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState<string | null>(null);

  // ── Contacto (alumno) ────────────────────────────────────────────────────
  const [editandoContacto, setEditandoContacto] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardandoContacto, setGuardandoContacto] = useState(false);
  const [errorContacto, setErrorContacto] = useState<string | null>(null);

  // ── Cambio de contraseña ─────────────────────────────────────────────────
  const [cambioClaveOpen, setCambioClaveOpen] = useState(false);
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirm, setClaveConfirm] = useState('');
  const [showClaves, setShowClaves] = useState(false);
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [claveCambiada, setClaveCambiada] = useState(false);

  if (!usuario || alumno.loading) return <FullPageLoader />;

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorAvatar(null);
    setSubiendo(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file, 256);
      await usuariosApi.updateAvatar(dataUrl);
      await refresh();
    } catch (err) {
      setErrorAvatar(extractErrorMessage(err, 'No se pudo actualizar la foto'));
    } finally {
      setSubiendo(false);
    }
  }

  async function quitarFoto() {
    setErrorAvatar(null);
    setSubiendo(true);
    try {
      await usuariosApi.removeAvatar();
      await refresh();
    } catch (err) {
      setErrorAvatar(extractErrorMessage(err, 'No se pudo quitar la foto'));
    } finally {
      setSubiendo(false);
    }
  }

  function abrirEdicionContacto() {
    setTelefono(alumno.data?.telefono ?? '');
    setDireccion(alumno.data?.direccion ?? '');
    setErrorContacto(null);
    setEditandoContacto(true);
  }

  async function guardarContacto() {
    setErrorContacto(null);
    setGuardandoContacto(true);
    try {
      await alumnosApi.updateMe({ telefono: telefono || undefined, direccion: direccion || undefined });
      await alumno.reload();
      setEditandoContacto(false);
    } catch (err) {
      setErrorContacto(extractErrorMessage(err, 'No se pudo guardar'));
    } finally {
      setGuardandoContacto(false);
    }
  }

  async function guardarClave() {
    setErrorClave(null);
    if (claveNueva.length < 8) {
      setErrorClave('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (claveNueva !== claveConfirm) {
      setErrorClave('Las contraseñas no coinciden.');
      return;
    }
    setGuardandoClave(true);
    try {
      await authApi.changePassword(claveActual, claveNueva);
      setClaveCambiada(true);
      setCambioClaveOpen(false);
      setClaveActual('');
      setClaveNueva('');
      setClaveConfirm('');
    } catch (err) {
      setErrorClave(extractErrorMessage(err, 'No se pudo cambiar la contraseña'));
    } finally {
      setGuardandoClave(false);
    }
  }

  function cancelarCambioClave() {
    setCambioClaveOpen(false);
    setClaveActual('');
    setClaveNueva('');
    setClaveConfirm('');
    setErrorClave(null);
    setClaveCambiada(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-screen-lg">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Mi perfil' }]} />
      <h1 className="mb-6 font-serif text-2xl font-semibold text-navy-900">Mi perfil</h1>

      {/* ── Identidad y datos ── */}
      <Card className="mb-4">
        {/* Avatar + nombre */}
        <div className="mb-6 flex flex-col items-center gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {usuario.avatarUrl ? (
              <img
                src={usuario.avatarUrl}
                alt="Foto de perfil"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-100"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-900 text-2xl font-semibold text-white">
                {getIniciales(usuario.nombre, usuario.apellido)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={subiendo}
              aria-label="Cambiar foto"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-white shadow-md transition-colors hover:bg-navy-800 disabled:opacity-60"
            >
              {subiendo ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onArchivo} className="hidden" />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="font-serif text-xl font-semibold text-slate-900">
              {usuario.nombre} {usuario.apellido}
            </h2>
            <p className="text-sm text-slate-500">{usuario.email}</p>
            <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
              <Badge tone="navy">{usuario.rol}</Badge>
              {usuario.avatarUrl && (
                <button
                  type="button"
                  onClick={quitarFoto}
                  disabled={subiendo}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-danger disabled:opacity-60"
                >
                  <Trash2 size={12} /> Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>

        {errorAvatar && <div className="mb-4"><ErrorAlert message={errorAvatar} /></div>}

        {/* Datos institucionales */}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm md:grid-cols-2">
          <Dato label="Email" valor={usuario.email} />
          <Dato label="Rol institucional" valor={usuario.rol} />
          {alumno.data && (
            <>
              <Dato label="Legajo" valor={alumno.data.legajo} />
              <Dato label="DNI" valor={alumno.data.dni} />
              <Dato label="Carrera" valor={alumno.data.carrera} />
              <Dato label="Año de ingreso" valor={String(alumno.data.anioIngreso)} />
              <Dato label="Fecha de nacimiento" valor={formatDate(alumno.data.fechaNacimiento)} />
              <Dato label="Estado" valor={<Badge tone="success">{alumno.data.estado}</Badge>} />
            </>
          )}
        </dl>

        {/* Datos de contacto editables (alumno) */}
        {alumno.data && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Datos de contacto</h3>
              {!editandoContacto && (
                <button
                  type="button"
                  onClick={abrirEdicionContacto}
                  className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                >
                  <Pencil size={13} /> Editar
                </button>
              )}
            </div>

            {editandoContacto ? (
              <div className="space-y-3">
                {errorContacto && <ErrorAlert message={errorContacto} />}
                <div>
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="form-input"
                    placeholder="Ej: +54 9 11 1234-5678"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="form-input"
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    maxLength={200}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={guardarContacto}
                    disabled={guardandoContacto}
                    leftIcon={guardandoContacto ? <Spinner size={14} className="text-white" /> : <Check size={14} />}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditandoContacto(false)}
                    disabled={guardandoContacto}
                    leftIcon={<X size={14} />}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm md:grid-cols-2">
                <Dato label="Teléfono" valor={alumno.data.telefono ?? '—'} />
                <Dato label="Dirección" valor={alumno.data.direccion ?? '—'} />
              </dl>
            )}
          </div>
        )}
      </Card>

      {/* ── Seguridad ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Seguridad</h3>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm md:grid-cols-2 mb-6">
          <Dato
            label="Último acceso"
            valor={
              usuario.ultimoLogin
                ? new Date(usuario.ultimoLogin).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : '—'
            }
          />
          <Dato label="Cuenta" valor={<Badge tone="success">Activa</Badge>} />
        </dl>

        {/* Cambio de contraseña */}
        <div className="border-t border-slate-100 pt-5">
          {claveCambiada && !cambioClaveOpen && (
            <p className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <Check size={15} /> Contraseña actualizada correctamente.
            </p>
          )}

          {!cambioClaveOpen ? (
            <button
              type="button"
              onClick={() => { setCambioClaveOpen(true); setClaveCambiada(false); }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <KeyRound size={15} className="text-slate-400" />
              Cambiar contraseña
            </button>
          ) : (
            <div className="space-y-3 max-w-sm">
              <p className="text-sm font-semibold text-slate-700">Cambiar contraseña</p>
              {errorClave && <ErrorAlert message={errorClave} />}

              <div>
                <label className="form-label">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showClaves ? 'text' : 'password'}
                    value={claveActual}
                    onChange={(e) => setClaveActual(e.target.value)}
                    className="form-input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaves((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center px-1 text-slate-400 hover:text-slate-600"
                  >
                    {showClaves ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Nueva contraseña</label>
                <input
                  type={showClaves ? 'text' : 'password'}
                  value={claveNueva}
                  onChange={(e) => setClaveNueva(e.target.value)}
                  className="form-input"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="form-label">Confirmar nueva contraseña</label>
                <input
                  type={showClaves ? 'text' : 'password'}
                  value={claveConfirm}
                  onChange={(e) => setClaveConfirm(e.target.value)}
                  className="form-input"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={guardarClave}
                  disabled={guardandoClave || !claveActual || !claveNueva || !claveConfirm}
                  leftIcon={guardandoClave ? <Spinner size={14} className="text-white" /> : <Check size={14} />}
                >
                  Guardar contraseña
                </Button>
                <Button
                  variant="secondary"
                  onClick={cancelarCambioClave}
                  disabled={guardandoClave}
                  leftIcon={<X size={14} />}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{valor}</dd>
    </div>
  );
}
