import { User } from "../interfaces/User";

export interface LoginResponse {
    message: string;
    token: string;
    refreshToken: string;
    user: User;
}