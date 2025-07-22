import React, { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';
import { isTokenExpired } from './utils/tokenExpiration.js';
import { refreshAccessToken } from './utils/refreshToken.js';
import { useWeb3Auth } from "@web3auth/modal/react";
import { logoutUser } from './utils/logoutUser';

const AgentContext = createContext();

export const useAgent = () => useContext(AgentContext);

export const AgentProvider = ({ children }) => {
    const [agent, setAgent] = useState(null);
    const [did, setDid] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    const { disconnect } = useWeb3Auth();

    const handleLogout = () => {
        logoutUser({ setAgent, setDid, disconnect });
    }
    /*
    const logoutUser = () => {
        setAgent(null);
        setDid(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        disconnect();
        console.log('User logged out.');
    }
    */

    useEffect(() => {
        const interval = setInterval(async () => {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!token || !refreshToken) {
                if (agent || did) {
                    handleLogout();
                }
                return; 
            }

            if (isTokenExpired(token)) {
                try {
                    const newAccessToken = await refreshAccessToken(refreshToken);
                    setAccessToken(newAccessToken);
                    console.log('Access token refreshed');
                } catch (err) {
                    console.warn('Refresh failed, logging out.', err);
                    handleLogout();
                }
            } else {
                setAccessToken(token);
            }
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [agent, did]);

    return (
        <AgentContext.Provider value={{ agent, setAgent, did, setDid, accessToken, setAccessToken }}>
            { children }
        </AgentContext.Provider>
    );
};