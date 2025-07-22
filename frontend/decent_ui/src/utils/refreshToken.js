

export const refreshAccessToken = async (refreshToken) => {
    const res = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ refresh: refreshToken })
    });
    const data = await res.json();
    if (res.ok) {
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