import { Bell, LogOut, Search } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { getIniciales } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { usuario, logout } = useAuth();

  if (!usuario) return null;

  const legajo = usuario.alumno?.legajo;
  const initials = getIniciales(usuario.nombre, usuario.apellido);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-6 shrink-0">
      {/* Logo + nombre */}
      <div className="flex items-center gap-3 min-w-[16rem]">
        <Logo size={28} />
        <div>
          <span className="font-serif text-lg font-semibold text-navy-900 leading-none">
            ISCR
          </span>
          <p className="text-[11px] text-slate-500 leading-tight">
            Sistema Integral de Gestión Académica
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Buscar materia, mesa, constancia…"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-12 py-2 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-300 bg-white rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Notificaciones */}
      <button
        type="button"
        className="relative p-2 text-slate-500 hover:text-navy-700 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cruz rounded-full" />
      </button>

      {/* Avatar + info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-slate-900 leading-tight">
            {usuario.nombre} {usuario.apellido}
          </p>
          <p className="text-xs text-slate-500">
            {legajo ? `Legajo · ${legajo}` : usuario.rol.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Salir */}
      <button
        type="button"
        onClick={logout}
        className="btn-secondary !py-1.5 !px-3 text-sm"
        aria-label="Cerrar sesión"
      >
        <LogOut size={16} />
        <span className="hidden md:inline">Salir</span>
      </button>
    </header>
  );
}
