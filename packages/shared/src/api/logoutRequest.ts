export namespace LogoutRequest {
    export interface Body {
        refreshToken?: string; // Optional: if provided, revokes specific refresh token
    }
}
