import { NavLink } from 'react-router-dom';
import { Home, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { modulesForRole } from '../../config/modules';

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

interface PeriodoInfo {
  titulo: string;
  detalle: string;
  progreso: number;
}

export function Sidebar({ periodo }: { periodo?: PeriodoInfo }) {
  const { usuario } = useAuth();

  // Inicio siempre primero; el resto sale de la config central de módulos.
  const items: NavItem[] = [
    { to: '/', label: 'Inicio', Icon: Home },
    ...modulesForRole(usuario?.rol).map((m) => ({ to: m.to, label: m.navLabel, Icon: m.Icon })),
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Menú</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
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
                <span className={isActive ? 'text-navy-700' : 'text-slate-400'}>
                  <item.Icon size={18} />
                </span>
                <span className="flex-1">{item.label}</span>
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
