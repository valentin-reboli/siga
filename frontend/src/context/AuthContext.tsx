import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import { tokenStorage, extractErrorMessage } from '../api/client';
import type { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setState({ usuario: null, loading: false, error: null });
      return;
    }
    try {
      const usuario = await authApi.me();
      setState({ usuario, loading: false, error: null });
    } catch {
      tokenStorage.clear();
      setState({ usuario: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { token } = await authApi.login(email, password);
      tokenStorage.set(token);
      const usuario = await authApi.me();
      setState({ usuario, loading: false, error: null });
    } catch (err) {
      setState({
        usuario: null,
        loading: false,
        error: extractErrorMessage(err, 'No se pudo iniciar sesión'),
      });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setState({ usuario: null, loading: false, error: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
