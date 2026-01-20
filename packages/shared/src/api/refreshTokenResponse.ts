export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds until access token expires
}
