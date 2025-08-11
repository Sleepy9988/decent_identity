
export const logoutUser = async ({ setAgent, setDid, disconnect }) => {
    setAgent(null);
    setDid(null);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('did');
    localStorage.removeItem('signature');

    try {
        await disconnect();
        console.log('User logged out.');
    } catch (err) {
        console.warn('Web3Auth logout failed:', err);
    }
    
    window.location.href = '/'
}