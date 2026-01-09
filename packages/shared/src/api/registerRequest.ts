export namespace RegisterRequest {
    export interface Body {
        email: string;
        username: string;
        password: string;
        firstName?: string;
        lastName?: string;
    }
}