export const logoutUser = async ({ setAgent, setDid, setSignature, setMeta, disconnect, setIsAuthenticated }) => {
    setAgent(null);
    setDid(null);
    setSignature(null);
    setMeta(null);
    setIsAuthenticated(false);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('did');
    localStorage.removeItem('signature');
    localStorage.removeItem('meta');

    try {
        if (typeof disconnect === 'function') {
            await disconnect();
            console.log('User logged out.');
        } else {
            console.warn('Web3Auth instance not available.');
        }
    } catch (err) {
        console.warn('Web3Auth logout failed:', err);
    }
}