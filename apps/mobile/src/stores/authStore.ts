import { create } from 'zustand';
import { authService, User } from '../services/auth.service';
import { storage } from '../utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) {
        set({ isInitialized: true });
        return;
      }

      const { user } = await authService.me();
      set({ user, isAuthenticated: true, isInitialized: true });
    } catch {
      await storage.clearTokens();
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user, token, refreshToken } = await authService.login(email, password);
      await storage.setAccessToken(token);
      await storage.setRefreshToken(refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true });
    try {
      const { user, token, refreshToken } = await authService.register(
        email,
        username,
        password,
      );
      await storage.setAccessToken(token);
      await storage.setRefreshToken(refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      await authService.logout(refreshToken ?? undefined);
    } catch {
      // Logout even if the API call fails
    } finally {
      await storage.clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
