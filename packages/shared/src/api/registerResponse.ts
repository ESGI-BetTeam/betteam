import { User } from '../interfaces/User';

export interface RegisterResponse {
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: User;
}
