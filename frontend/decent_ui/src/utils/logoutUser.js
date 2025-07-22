export const logoutUser = ({ setAgent, setDid, setAccessToken, disconnect }) => {
    setAgent(null);
    setDid(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    disconnect();
    console.log('User logged out.');
}