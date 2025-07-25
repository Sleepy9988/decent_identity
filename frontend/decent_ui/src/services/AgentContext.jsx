import React, { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';
import { isTokenExpired } from '../utils/tokenExpiration.js';
import { refreshAccessToken } from '../utils/refreshToken.js';
import { useWeb3Auth } from "@web3auth/modal/react";
import { logoutUser } from '../utils/logoutUser.js';

const AgentContext = createContext();

export const useAgent = () => useContext(AgentContext);

export const AgentProvider = ({ children }) => {
    const [agent, setAgent] = useState(null);
    const [did, setDid] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    const { disconnect } = useWeb3Auth();

    const handleLogout = () => {
        logoutUser({ setAgent, setDid, setAccessToken, disconnect });
    }

    useEffect(() => {
        const storedDid = localStorage.getItem('did');
        const storedToken = localStorage.getItem('accessToken');
        if (storedDid) setDid(storedDid);
        if (storedToken) setAccessToken(storedToken);
    }, []);

    useEffect(() => {
        if (did) {
            localStorage.setItem('did', did);
        } else {
            localStorage.removeItem('did');
        }
    }, [did]);

    useEffect(() => {
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
        } else {
            localStorage.removeItem('accessToken');
        }
    }, [accessToken]);
   
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