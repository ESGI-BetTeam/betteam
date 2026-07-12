import { api } from './api';

export const userService = {
  async registerPushToken(token: string): Promise<void> {
    await api.post('/users/push-token', { token });
  },
};
