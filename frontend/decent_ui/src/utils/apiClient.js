const BASE_URL = 'http://localhost:8000';
const TIMEOUT = 15000;

// Add JSON headers only if body is present
const jsonHeaders = (body) => (body !== undefined ? { 'Content-Type': 'application/json'} : {});
// Detect if body is FormData (special handling, no JSON headers)
const isFormData = (body) => typeof FormData !== 'undefined' && body instanceof FormData;

/**
 * Attempts to refresh the access tooken using the stored refresh token.
 * - Loads refreshAccessToken dynamically from refreshToken.js
 * - Returns the new access token string or null if refresh failed. 
 */
async function refreshAccessTokenHelper() {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) return null;

    try {
        const { refreshAccessToken } = await import('./refreshToken');
        const newAccess = await refreshAccessToken(refresh);
        return newAccess || null;
    } catch {
        return null;
    }
}

/**
 * Wrap a promise with timeout.
 * Rejects with an Error if not resolved within 15ms 
 * 
 * Documentation: https://dev.to/nikosanif/create-promises-with-timeout-error-in-typescript-fmm
 */
function promiseWithTimeout(promise, ms = TIMEOUT) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timed out.')), ms);
        promise
            .then((v) => {
                clearTimeout(timeout);
                resolve(v);
            })
            .catch((e) => {
                clearTimeout(timeout);
                reject(e);
            })
    });
}

/**
 * apiRequest
 * 
 * Generic API request helper for the application.
 * Handles: 
 * - Base URL concatenation. 
 * - Request timeout via promiseWithTimeout.
 * - JSON vs FormData body handling. 
 * - Automatic Bearer token injection (from localStorage by default).
 * - Transparent token refresh if 401 is returned. 
 * 
 * Params: 
 * - path: string endpoint path or absolute URL 
 * - options: 
 *    - method: HTTP method 
 *    - body: request body (object for JSON, FormData, or undefined)
 *    - token: bearer token
 *    - timeout: request timeout override
 *    - headers: additional headers to include.
 * 
 * Returns: parsed JSON response, or null for 204 responses.
 * Throws: Error with status + payload if non-2xx. 
 */

export async function apiRequest(
    path, 
    {
        method = 'GET',
        body,
        token = localStorage.getItem('accessToken') || undefined, 
        timeout,
        headers = {},
    } = {}
) {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

    // Perform the fetch with appropriate headers/body
    const handleFetch = async (bearer) => {
        const res = await promiseWithTimeout(
            fetch(url, {
                method, 
                credentials: 'include',
                headers: {
                    ...(isFormData(body) ? {} : jsonHeaders(body)),
                    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
                    ...headers,
                },
                body: isFormData(body) ? body : (body !== undefined ? JSON.stringify(body) : undefined),
            }),
            timeout
        );

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (res.status === 204) return null;

        const data = isJson ? await res.json().catch(() => ({})) : {};

        if (!res.ok) {
            const err = new Error(`${res.status} ${res.statusText}`);
            err.status = res.status;
            err.payload = data;
            throw err;
        }
        return data;
    };

    try {
        return await handleFetch(token);
    } catch (err) {
        // Handle token expiration → refresh and retry
        if (err && err.status === 401) {
            const newAccess = await refreshAccessTokenHelper();
            if (newAccess) {
                localStorage.setItem('accessToken', newAccess);
                return await handleFetch(newAccess);
            }
        }
        throw err;
    }
}