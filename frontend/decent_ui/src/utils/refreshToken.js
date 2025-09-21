import { isTokenExpired } from "./tokenExpiration";
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

/**
 * refreshAccessToken
 * 
 * Attempts to refresh the user's access token using a valid refresh token.
 * - First checks if the provided refresh token has expired (client-side).
 * - Sends a POST request to the backend '/api/token/refresh/' endpoint.
 * 
 * On success: 
 * - Updates accessToken in localStorage 
 * - Updates refreshToken if a new one is returned 
 * - Returns the new access token string 
 * 
 * On failure: 
 * - Logs error details.
 * - Throws an error to be handled by the caller.
 * 
 * Params:
 * - refreshToken: the current refresh token stored in client
 * 
 * Returns:
 * - new access token
 */
export const refreshAccessToken = async (refreshToken) => {
    // Check if refresh token is still valid
    if (isTokenExpired(refreshToken)) {
        throw new Error('Refresh token has expired');
    }

    // Attempt refresh via backend
    const res = await fetch(`${BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ refresh: refreshToken })
    });

    const data = await res.json();

    if (res.ok) {
        // Store new access token and refresh token (if provided)
        localStorage.setItem('accessToken', data.access);
        if (data.refresh) {
            localStorage.setItem('refreshToken', data.refresh);
        }
        return data.access;
    } else {
        console.error('Refresh error:', data);
        throw new Error('Failed to refresh token');
    }
}