import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { isTokenExpired } from '../utils/tokenExpiration.js';
import { refreshAccessToken } from '../utils/refreshToken.js';
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
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
    const [meta, setMeta] = useState(() => {
    try {
        const raw = localStorage.getItem('meta');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
    });

    const { disconnect } = useWeb3AuthDisconnect();
   
    
    const handleLogout = useCallback(() => {
        logoutUser({ setAgent, setDid, setSignature, setMeta, disconnect });
    }, [setAgent, setDid, setSignature, setMeta, disconnect]);

    useEffect(() => {
        const restoreSession = async () => {
            const storedDid = localStorage.getItem('did');
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const signature = localStorage.getItem('signature');

            if (!storedDid) return;

            try {
                if (accessToken && !isTokenExpired(accessToken)) {
                    const ids = await getIdentities(signature);
                    setIdentity(ids.identities);
                } else if (refreshToken) {
                    const newAccess = await refreshAccessToken(refreshToken);
                    localStorage.setItem('accessToken', newAccess);
                    const ids = await getIdentities(signature);
                    setIdentity(ids.identities);
                } else {
                    handleLogout();
                }
            } catch (err) {
                console.warn(err);
                handleLogout();
            }
        };
        restoreSession();
    }, [handleLogout]);

    useEffect(() => {
        if (did) {
            localStorage.setItem('did', did);
        } else localStorage.removeItem('did');
        if (signature) {
            localStorage.setItem('signature', signature);
        } else localStorage.removeItem('signature');
        if (meta) {
            localStorage.setItem('meta', JSON.stringify(meta));
        } else localStorage.removeItem('meta');

    }, [did, signature, meta]);
   
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
                setSocket(newSocket);

                newSocket.onopen = () => console.log("WebSocket connected.");
                newSocket.onmessage = (e) => setNotifications(prev => [...prev, JSON.parse(e.data)]);
                newSocket.onclose = (e) => {
                    console.log("WebSocket disconnected.", e);
                    setSocket(null);
                }
                newSocket.onerror = (err) => console.error("WebSocket error:", err);
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

    const value = useMemo(() => ({
        agent, setAgent, 
        did, setDid, 
        id, setIdentity, 
        signature, setSignature, 
        meta, setMeta, 
        notifications,
        handleLogout
    }), [agent, did, id, signature, meta, notifications, handleLogout]);

    return (
        <AgentContext.Provider value={ value }>{ children }</AgentContext.Provider>
    );
};