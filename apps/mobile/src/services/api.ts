import axios from 'axios';
import { storage } from '../utils/storage';

export const API_URL = 'https://betteam-api-dev.up.railway.app';

/**
 * Resolves a stored media value into a displayable URI.
 * - absolute URLs (http/https) and base64 data-URIs are returned as-is
 * - server-relative paths (e.g. "/uploads/leagues/x.jpg") are prefixed with the API origin
 */
export function resolveMediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  return `${API_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 by refreshing the token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        await storage.clearTokens();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        await storage.setAccessToken(data.accessToken);
        await storage.setRefreshToken(data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await storage.clearTokens();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
