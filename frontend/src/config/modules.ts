import {
  ClipboardList,
  FileText,
  BookOpen,
  Calendar,
  FileBadge2,
  User,
  UserCog,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import type { RolUsuario } from '../types';

/**
 * ============================================================================
 *  Módulos del campus — única fuente de verdad
 * ============================================================================
 *  Define qué funciones existen y a qué roles corresponden. Tanto el menú
 *  lateral (Sidebar) como la grilla de accesos rápidos del dashboard se
 *  construyen a partir de esta lista, así nunca se desincronizan.
 * ============================================================================
 */

export interface AppModule {
  to: string;
  navLabel: string; // etiqueta corta para el sidebar
  title: string; // título de la card en el dashboard
  description: string; // descripción de la card
  Icon: LucideIcon;
  roles: RolUsuario[];
  accentBg: string; // clase Tailwind para el fondo del ícono
  accentFg: string; // clase Tailwind para el color del ícono
}

const STAFF: RolUsuario[] = ['SUPERADMIN', 'ADMINISTRACION'];
const TODOS: RolUsuario[] = ['ALUMNO', 'DOCENTE', 'SUPERADMIN', 'ADMINISTRACION'];

export const MODULES: AppModule[] = [
  {
    to: '/inscripciones',
    navLabel: 'Inscripciones',
    title: 'Inscripciones',
    description: 'Cursadas y mesas de examen.',
    Icon: ClipboardList,
    roles: ['ALUMNO', ...STAFF],
    accentBg: 'bg-sky-50',
    accentFg: 'text-sky-600',
  },
  {
    to: '/mis-materias',
    navLabel: 'Mis materias',
    title: 'Mis materias',
    description: 'Tus cátedras: alumnos y notas.',
    Icon: GraduationCap,
    roles: ['DOCENTE', 'SUPERADMIN'],
    accentBg: 'bg-teal-50',
    accentFg: 'text-teal-600',
  },
  {
    to: '/legajo',
    navLabel: 'Legajos',
    title: 'Legajo académico',
    description: 'Historial de cursadas y notas.',
    Icon: FileText,
    roles: ['ALUMNO', ...STAFF],
    accentBg: 'bg-violet-50',
    accentFg: 'text-violet-600',
  },
  {
    to: '/materias',
    navLabel: 'Materias',
    title: 'Materias y foros',
    description: 'Catálogo, correlativas y aula virtual.',
    Icon: BookOpen,
    roles: TODOS,
    accentBg: 'bg-emerald-50',
    accentFg: 'text-emerald-600',
  },
  {
    to: '/calendario',
    navLabel: 'Calendario',
    title: 'Calendario',
    description: 'Fechas clave del ciclo lectivo.',
    Icon: Calendar,
    roles: TODOS,
    accentBg: 'bg-amber-50',
    accentFg: 'text-amber-600',
  },
  {
    to: '/constancias',
    navLabel: 'Constancias',
    title: 'Constancias',
    description: 'Solicitá y descargá certificados.',
    Icon: FileBadge2,
    roles: ['ALUMNO', ...STAFF],
    accentBg: 'bg-rose-50',
    accentFg: 'text-rose-600',
  },
  {
    to: '/usuarios',
    navLabel: 'Usuarios',
    title: 'Gestión de usuarios',
    description: 'Altas y administración de cuentas.',
    Icon: UserCog,
    roles: [...STAFF],
    accentBg: 'bg-navy-50',
    accentFg: 'text-navy-700',
  },
  {
    to: '/perfil',
    navLabel: 'Mi perfil',
    title: 'Mi perfil',
    description: 'Tus datos y seguridad.',
    Icon: User,
    roles: TODOS,
    accentBg: 'bg-slate-100',
    accentFg: 'text-slate-600',
  },
];

/** Módulos disponibles para un rol, en el orden definido arriba. */
export function modulesForRole(rol?: RolUsuario): AppModule[] {
  if (!rol) return [];
  return MODULES.filter((m) => m.roles.includes(rol));
}
