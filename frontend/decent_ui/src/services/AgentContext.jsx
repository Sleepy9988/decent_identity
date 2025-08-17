import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isTokenExpired } from '../utils/tokenExpiration.js';
import { refreshAccessToken } from '../utils/refreshToken.js';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { logoutUser } from '../utils/logoutUser.js';
import { getIdentities } from '../components/helper.js';

const AgentContext = createContext();

export const useAgent = () => useContext(AgentContext);

export const AgentProvider = ({ children }) => {
    const [agent, setAgent] = useState(null);
    const [did, setDid] = useState(() => localStorage.getItem('did'));
    const [signature, setSignature] = useState(null);
    const [id, setIdentity] = useState([]);
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const { disconnect } = useWeb3AuthConnect();
    
    const handleLogout = useCallback(() => {
        logoutUser({ setAgent, setDid, disconnect });
    }, [setAgent, setDid, disconnect]);

    const restoreSession = useCallback(async () => {
        const storedDid = localStorage.getItem('did');
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const signature = localStorage.getItem('signature');

        if (storedDid && accessToken && !isTokenExpired(accessToken)) {
            try {
                const ids = await getIdentities(signature);
                setIdentity(ids.identities);
            } catch (err) {
                console.warn(err);
                handleLogout();
            }
        } else if (storedDid) {
            try {
                const newAccess = await refreshAccessToken(refreshToken);
                localStorage.setItem('accessToken', newAccess);
                const ids = await getIdentities(signature);
                setIdentity(ids.identities);
            } catch (err) {
                console.warn(err);
                handleLogout();
            }
        }
    }, [handleLogout, setIdentity]);
    
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    useEffect(() => {
        if (did) {
            localStorage.setItem('did', did);
        } else {
            localStorage.removeItem('did');
        }
        if (signature) {
            localStorage.setItem('signature', signature);
        } else {
            localStorage.removeItem('signature');
        }

    }, [did, signature]);
   
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
                    const newAccess = await refreshAccessToken(refreshToken);
                    localStorage.setItem('accessToken', newAccess);
                    console.log('Access token refreshed');
                } catch (err) {
                    console.warn('Refresh failed, logging out.', err);
                    handleLogout();
                }
        }
    },  5 * 60 * 1000);
    
        return () => clearInterval(interval);
    }, [handleLogout, agent, did]);


    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (did && !socket) {
            try {
                const newSocket = new WebSocket(`ws://localhost:8001/ws/notifications/${encodeURIComponent(did)}/?token=${encodeURIComponent(token)}`);

                newSocket.onopen = () => {
                    console.log("WebSocket connected.");

                };
                newSocket.onmessage = (e) => {
                    const data = JSON.parse(e.data);
                    setNotifications(prev => [...prev, data]);
                };

                newSocket.onclose = (e) => {
                    console.log("WebSocket disconnected.", e);
                    setSocket(null);
                }

                newSocket.onerror = (err) => {
                    console.error("WebSocket error:", err);
                } 
            } catch (err) {
                console.error("Failed to establish WebSocket conenction", err);
            }
        }
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [did, socket]);

    return (
        <AgentContext.Provider 
            value={{ 
                agent, setAgent, did, setDid, id, setIdentity, signature, setSignature, notifications
            }}
        >
            { children }
        </AgentContext.Provider>
    );
};