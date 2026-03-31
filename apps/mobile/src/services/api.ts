import axios from 'axios';
import { storage } from '../utils/storage';

const API_URL = 'https://betteam-api-dev.up.railway.app';

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
