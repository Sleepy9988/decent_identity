import React, { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';
import { isTokenExpired } from './utils/tokenExpiration.js';
import { refreshAccessToken } from './utils/refreshToken.js';
import { useWeb3Auth } from "@web3auth/modal/react";

const AgentContext = createContext();

export const useAgent = () => useContext(AgentContext);

export const AgentProvider = ({ children }) => {
    const [agent, setAgent] = useState(null);
    const [did, setDid] = useState(null);

    const { disconnect } = useWeb3Auth();

    const logoutUser = () => {
        setAgent(null);
        setDid(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        disconnect();
        console.log('User logged out.');
    }

    useEffect(() => {
        const interval = setInterval(async () => {
            const token = localStorage.getItem('authToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!token || !refreshToken) {
                if (agent || did) {
                    logoutUser();
                }
                return; 
            }

            if (isTokenExpired(token)) {
                try {
                    await refreshAccessToken(refreshToken);
                    console.log('Access token refreshed');
                } catch (err) {
                    console.warn('Refresh failed, logging out.', err);
                    logoutUser();
                }
            }
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, [agent, did]);

    return (
        <AgentContext.Provider value={{ agent, setAgent, did, setDid }}>
            { children }
        </AgentContext.Provider>
    );
};