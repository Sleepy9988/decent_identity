import { jwtDecode } from 'jwt-decode';

export function isTokenExpired(token) {
    if (!token) return true;
    try {
        const { exp } = jwtDecode(token);
        const now = Date.now() / 1000;
        return exp < now;
    } catch (err) {
        console.error(err);
        return true;
    }
}