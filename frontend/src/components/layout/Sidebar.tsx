import { NavLink } from 'react-router-dom';
import {
  Home, ClipboardList, FileText, BookOpen,
  Calendar, FileBadge2, User, Users, UserCog, GraduationCap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { RolUsuario } from '../../types';

interface NavItem { to: string; label: string; icon: ReactNode; badge?: number }

function getNavItems(rol?: RolUsuario): NavItem[] {
  switch (rol) {
    case 'ALUMNO':
      return [
        { to: '/', label: 'Inicio', icon: <Home size={18} /> },
        { to: '/inscripciones', label: 'Inscripciones', icon: <ClipboardList size={18} /> },
        { to: '/legajo', label: 'Mi legajo académico', icon: <FileText size={18} /> },
        { to: '/materias', label: 'Catálogo de materias', icon: <BookOpen size={18} /> },
        { to: '/calendario', label: 'Calendario académico', icon: <Calendar size={18} /> },
        { to: '/constancias', label: 'Constancias', icon: <FileBadge2 size={18} /> },
        { to: '/perfil', label: 'Mi perfil', icon: <User size={18} /> },
      ];

    case 'DOCENTE':
      return [
        { to: '/', label: 'Inicio', icon: <Home size={18} /> },
        { to: '/mis-materias', label: 'Mis materias', icon: <GraduationCap size={18} /> },
        { to: '/calendario', label: 'Calendario académico', icon: <Calendar size={18} /> },
        { to: '/perfil', label: 'Mi perfil', icon: <User size={18} /> },
      ];

    case 'PRECEPTOR':
      return [
        { to: '/', label: 'Inicio', icon: <Home size={18} /> },
        { to: '/inscripciones', label: 'Inscripciones', icon: <ClipboardList size={18} /> },
        { to: '/legajo', label: 'Legajos de alumnos', icon: <Users size={18} /> },
        { to: '/materias', label: 'Catálogo de materias', icon: <BookOpen size={18} /> },
        { to: '/calendario', label: 'Calendario académico', icon: <Calendar size={18} /> },
        { to: '/constancias', label: 'Constancias', icon: <FileBadge2 size={18} /> },
        { to: '/perfil', label: 'Mi perfil', icon: <User size={18} /> },
      ];

    case 'ADMIN':
    case 'ADMINISTRATIVO':
    default:
      return [
        { to: '/', label: 'Inicio', icon: <Home size={18} /> },
        { to: '/inscripciones', label: 'Inscripciones', icon: <ClipboardList size={18} /> },
        { to: '/legajo', label: 'Legajos de alumnos', icon: <Users size={18} /> },
        { to: '/materias', label: 'Catálogo de materias', icon: <BookOpen size={18} /> },
        { to: '/calendario', label: 'Calendario académico', icon: <Calendar size={18} /> },
        { to: '/constancias', label: 'Constancias', icon: <FileBadge2 size={18} /> },
        { to: '/usuarios', label: 'Gestión de usuarios', icon: <UserCog size={18} /> },
        { to: '/perfil', label: 'Mi perfil', icon: <User size={18} /> },
      ];
  }
}

interface PeriodoInfo { titulo: string; detalle: string; progreso: number }

export function Sidebar({ periodo }: { periodo?: PeriodoInfo }) {
  const { usuario } = useAuth();
  const items = getNavItems(usuario?.rol);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Menú</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-50 text-navy-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-navy-700' : 'text-slate-400'}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-cruz text-white text-[11px] font-semibold rounded-full px-1.5 py-0.5">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {periodo && (
        <div className="border-t border-slate-200 px-6 py-5">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">
            Período actual
          </p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{periodo.titulo}</p>
          <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy-700 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, periodo.progreso))}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">{periodo.detalle}</p>
        </div>
      )}
    </aside>
  );
}
