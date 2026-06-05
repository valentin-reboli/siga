import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { RolUsuario } from '../types';
import { FullPageLoader } from './ui/Spinner';

/**
 * Guard de ruta por rol (defensa en profundidad en el frontend).
 * El backend ya valida permisos, pero esto evita que un rol no autorizado
 * llegue siquiera a renderizar la página.
 */
export function RoleRoute({
  allow,
  children,
}: {
  allow: RolUsuario[];
  children: ReactNode;
}) {
  const { usuario, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!allow.includes(usuario.rol)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
