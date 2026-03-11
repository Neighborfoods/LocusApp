import api from './client';
import { AuthResponse, UserPrivateProfile } from '@/types/models';

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  housing_reason: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', payload);
    return data.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  me: async (): Promise<UserPrivateProfile> => {
    const { data } = await api.get('/auth/me');
    return data.data;
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return data.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout').catch(() => {}); // best-effort
  },
};
