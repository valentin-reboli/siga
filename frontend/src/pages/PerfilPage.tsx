import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { alumnosApi } from '../api/alumnos.api';
import { usuariosApi } from '../api/usuarios.api';
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
  const [error, setError] = useState<string | null>(null);

  // Estado para edición de contacto
  const [editandoContacto, setEditandoContacto] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardandoContacto, setGuardandoContacto] = useState(false);
  const [errorContacto, setErrorContacto] = useState<string | null>(null);

  if (!usuario || alumno.loading) return <FullPageLoader />;

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-elegir el mismo archivo
    if (!file) return;
    setError(null);
    setSubiendo(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file, 256);
      await usuariosApi.updateAvatar(dataUrl);
      await refresh();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo actualizar la foto'));
    } finally {
      setSubiendo(false);
    }
  }

  async function quitarFoto() {
    setError(null);
    setSubiendo(true);
    try {
      await usuariosApi.removeAvatar();
      await refresh();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo quitar la foto'));
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

  return (
    <div className="mx-auto max-w-screen-lg">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Mi perfil' }]} />

      <h1 className="mb-6 font-serif text-2xl font-semibold text-navy-900">Mi perfil</h1>

      <Card>
        <div className="mb-6 flex flex-col items-center gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
          {/* Avatar */}
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onArchivo}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="font-serif text-xl font-semibold text-slate-900">
              {usuario.nombre} {usuario.apellido}
            </h2>
            <p className="text-sm text-slate-500">{usuario.email}</p>
            <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
              <Badge tone="navy">{usuario.rol}</Badge>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={subiendo}
                className="text-xs font-medium text-navy-700 hover:underline disabled:opacity-60"
              >
                Cambiar foto
              </button>
              {usuario.avatarUrl && (
                <button
                  type="button"
                  onClick={quitarFoto}
                  disabled={subiendo}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-danger disabled:opacity-60"
                >
                  <Trash2 size={12} /> Quitar
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        )}

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

        {/* Datos de contacto editables (solo para ALUMNO) */}
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
