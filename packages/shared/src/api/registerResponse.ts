import { User } from "../interfaces/User";

export interface RegisterResponse {
    token : string;
    user : User;
}