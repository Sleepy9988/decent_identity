import { jwtDecode } from 'jwt-decode';

/**
 * isTokenExpired
 * 
 * Utility to check whether a JWT is expired. 
 * 
 * - Decodes the token using jwt-decode
 * - Compared the exp (expiration time in seconds since epoch) against current time.
 * - Returns true if: 
 *    - No token is provided
 *    - Token is invalid/un-decodable
 *    - Current time is past the expiration
 * - Returns false if token is valid and not expired. 
 * 
 * Params: 
 * - token: a JWT string
 * Returns: Whether the token is expired. 
 */

export function isTokenExpired(token) {
    if (!token) return true;
    try {
        // Extract expiration claim
        const { exp } = jwtDecode(token);

        // Current time in seconds
        const now = Date.now() / 1000;
        return exp < now;
    } catch (err) {
        console.error(err);
        // Consider invalid/undecodable token as expired
        return true;
    }
}