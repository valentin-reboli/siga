import { apiClient } from './client';
import type { LoginResponse, Usuario } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  me: () => apiClient.get<Usuario>('/auth/me').then((r) => r.data),
};
