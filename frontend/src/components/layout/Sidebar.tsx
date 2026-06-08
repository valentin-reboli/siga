import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, ClipboardCheck, ClipboardList, FileText, FileBadge2, BookOpen, UserCog, GraduationCap, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { usuariosApi } from '../../api/usuarios.api';
import { modulesForRole } from '../../config/modules';
import { Spinner } from '../ui/Spinner';

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

function PeriodoWidget({ periodo }: { periodo: PeriodoInfo }) {
  return (
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
  );
}

export function Sidebar({ periodo }: { periodo?: PeriodoInfo }) {
  const { usuario } = useAuth();
  const isDocente = usuario?.rol === 'DOCENTE';

  const misMaterias = useApi(
    () => (isDocente && usuario ? usuariosApi.getMaterias(usuario.id) : Promise.resolve([])),
    [isDocente, usuario?.id],
  );

  const materias = (misMaterias.data ?? []) as Array<{
    materiaId: string;
    materia: { id: string; codigo: string; nombre: string };
  }>;

  // ── Sidebar específico para DOCENTE con materias dinámicas ────────────────
  if (isDocente) {
    return (
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-6 py-5">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Menú</p>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto pb-4">
          {/* Inicio */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-50 text-navy-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-navy-700' : 'text-slate-400'}>
                  <Home size={18} />
                </span>
                <span className="flex-1">Inicio</span>
              </>
            )}
          </NavLink>

          {/* Mis cátedras — links dinámicos por materia */}
          <p className="mt-5 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Mis cátedras
          </p>
          {misMaterias.loading ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <Spinner size={12} />
              <span className="text-xs text-slate-400">Cargando…</span>
            </div>
          ) : materias.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400 italic">Sin materias asignadas</p>
          ) : (
            <div className="space-y-0.5">
              {materias.map((dm) => (
                <NavLink
                  key={dm.materiaId}
                  to={`/materias/${dm.materia.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                          isActive ? 'bg-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {dm.materia.codigo.slice(-2)}
                      </span>
                      <span className="flex-1 truncate text-xs leading-snug">
                        {dm.materia.nombre}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {/* Gestión */}
          <p className="mt-5 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Gestión
          </p>
          <div className="space-y-0.5">
            {[
              { to: '/mis-materias', label: 'Calificaciones', Icon: ClipboardCheck },
              { to: '/calendario', label: 'Calendario', Icon: Calendar },
              { to: '/perfil', label: 'Mi perfil', Icon: User },
            ].map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy-50 text-navy-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-navy-700' : 'text-slate-400'}>
                      <Icon size={18} />
                    </span>
                    <span className="flex-1">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {periodo && <PeriodoWidget periodo={periodo} />}
      </aside>
    );
  }

  // ── Sidebar específico para SUPERADMIN con navegación agrupada ─────────────
  if (usuario?.rol === 'SUPERADMIN') {
    type Group = { label: string; items: Array<{ to: string; label: string; Icon: LucideIcon }> };
    const groups: Group[] = [
      {
        label: 'Principal',
        items: [{ to: '/', label: 'Inicio', Icon: Home }],
      },
      {
        label: 'Gestión académica',
        items: [
          { to: '/inscripciones', label: 'Inscripciones', Icon: ClipboardList },
          { to: '/legajo', label: 'Legajos', Icon: FileText },
          { to: '/constancias', label: 'Constancias', Icon: FileBadge2 },
          { to: '/materias', label: 'Materias y foros', Icon: BookOpen },
        ],
      },
      {
        label: 'Administración',
        items: [
          { to: '/usuarios', label: 'Usuarios', Icon: UserCog },
          { to: '/mis-materias', label: 'Calificaciones', Icon: GraduationCap },
        ],
      },
      {
        label: 'Sistema',
        items: [
          { to: '/calendario', label: 'Calendario', Icon: Calendar },
          { to: '/perfil', label: 'Mi perfil', Icon: User },
        ],
      },
    ];

    return (
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-6 py-5">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Menú</p>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto pb-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mt-5 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-navy-50 text-navy-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }: { isActive: boolean }) => (
                      <>
                        <span className={isActive ? 'text-navy-700' : 'text-slate-400'}>
                          <Icon size={18} />
                        </span>
                        <span className="flex-1">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {periodo && <PeriodoWidget periodo={periodo} />}
      </aside>
    );
  }

  // ── Sidebar genérico para otros roles ────────────────────────────────────
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

      {periodo && <PeriodoWidget periodo={periodo} />}
    </aside>
  );
}
