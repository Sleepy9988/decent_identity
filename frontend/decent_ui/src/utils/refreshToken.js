export async function refreshAccessToken(refreshToken) {
    const res = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ refresh: refreshToken })
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('authToken', data.access);
        if (data.refresh) {
            localStorage.setItem('authToken', data.refresh);
        }
        return data.access;
    } else {
        console.error('Refresh error:', data);
        throw new Error('Failed to refresh token');
    }
}