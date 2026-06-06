import { LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { getIniciales } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { MateriaQuickSearch } from './MateriaQuickSearch';
import { NotificacionesMenu } from './NotificacionesMenu';

export function Header() {
  const { usuario, logout } = useAuth();

  if (!usuario) return null;

  const legajo = usuario.alumno?.legajo;
  const initials = getIniciales(usuario.nombre, usuario.apellido);

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white flex items-center gap-4 px-4 sm:px-6">
      {/* Logo + nombre */}
      <div className="flex items-center gap-3 shrink-0">
        <Logo size={28} />
        <div className="hidden sm:block">
          <span className="font-serif text-lg font-semibold text-navy-900 leading-none">ISCR</span>
          <p className="text-[11px] text-slate-500 leading-tight">
            Sistema Integral de Gestión Académica
          </p>
        </div>
      </div>

      {/* Buscador global de materias (ocupa el espacio central) */}
      <MateriaQuickSearch />

      {/* Acciones del usuario — ancladas a la derecha */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        <NotificacionesMenu />

        <div className="flex items-center gap-3">
          {usuario.avatarUrl ? (
            <img
              src={usuario.avatarUrl}
              alt="Foto de perfil"
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="text-xs text-slate-500">
              {legajo ? `Legajo · ${legajo}` : usuario.rol.toLowerCase()}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="btn-secondary !px-3 !py-1.5 text-sm"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
