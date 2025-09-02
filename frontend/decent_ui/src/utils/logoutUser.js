/**
 * logoutUser
 * 
 * Clears the user session both locally (state + storage) and remotely (Web3Auth)
 * 
 * Steps: 
 * 1. Resets agent, DID, signature, and metadata in global state. 
 * 2. Marks user as not authenticated. 
 * 3. Removes all authentication-related items from localStorage.
 * 4. Attempts to call disconnect on Web3Auth if available.
 * 5. Warns failure.
 * 
 * Params: 
 * - setAgent - setter to clear Veramo agent 
 * - setDid - setter to clear DID
 * - setSignature - setter to clear user signature
 * - setMeta - setter to clear user metadata 
 * - disconnect - Web3Auth disconnect function 
 * - setIsAuthenticated - setter to update auth state
 */

export const logoutUser = async ({ setAgent, setDid, setSignature, setMeta, disconnect, setIsAuthenticated }) => {
    // Reset context values
    setAgent(null);
    setDid(null);
    setSignature(null);
    setMeta(null);
    setIsAuthenticated(false);

    // Clear persisted tokens & session data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('did');
    localStorage.removeItem('signature');
    localStorage.removeItem('meta');

    try {
        // Attempt Web3Auth disconnect
        if (typeof disconnect === 'function') {
            await disconnect();
        } else {
            console.warn('Web3Auth instance not available.');
        }
    } catch (err) {
        console.warn('Web3Auth logout failed:', err);
    }
}