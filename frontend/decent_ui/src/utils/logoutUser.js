export const logoutUser = ({ setAgent, setDid, setAccessToken, disconnect }) => {
    setAgent(null);
    setDid(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('did');
    disconnect();
    console.log('User logged out.');
}