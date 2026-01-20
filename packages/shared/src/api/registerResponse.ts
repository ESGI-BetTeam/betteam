import { User } from "../interfaces/User";

export interface RegisterResponse {
    token: string;
    refreshToken: string;
    user: User;
}