export namespace LoginRequest {
    export interface Body {
        email: string;
        password: string; // Clear text password
    }
}