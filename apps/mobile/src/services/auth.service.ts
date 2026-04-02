import { api } from './api';

export interface User {
  id: string;
  avatar: string | null;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

interface LoginResponse {
  message: string;
  user: User;
  token: string;
  refreshToken: string;
}

interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface AuthMeResponse {
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async register(
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register', {
      email,
      username,
      password,
      firstName,
      lastName,
    });
    return data;
  },

  async me(): Promise<AuthMeResponse> {
    const { data } = await api.get<AuthMeResponse>('/auth/me');
    return data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },
};
