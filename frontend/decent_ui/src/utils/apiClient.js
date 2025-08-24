const BASE_URL = 'http://localhost:8000';
const TIMEOUT = 15000;

const jsonHeaders = (body) => (body !== undefined ? { 'Content-Type': 'application/json'} : {});
const authHeaders = (token) => (token ? {Authorization: `Bearer ${token}` } : {});

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

// Documentation: https://dev.to/nikosanif/create-promises-with-timeout-error-in-typescript-fmm

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

    const handleFetch = async (bearer) => {
        const res = await promiseWithTimeout(
            fetch(url, {
                method, 
                credentials: 'include',
                headers: {
                    ...jsonHeaders(body),
                    ...authHeaders(bearer),
                    ...headers,
                },
                body: body !== undefined ? JSON.stringify(body) : undefined,
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