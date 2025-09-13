import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { isTokenExpired } from '../utils/tokenExpiration';
import { refreshAccessToken } from '../utils/refreshToken';
import { useWeb3AuthDisconnect} from "@web3auth/modal/react";
import { logoutUser } from '../utils/logoutUser';
import { getIdentities } from '../utils/apiHelper';

// Context for agent, DID, session, identities, notifications, and metadata
const AgentContext = createContext();

export const useAgent = () => useContext(AgentContext);

/**
* AgentProvider
*
* Centralized app state for:
* - Auth/session (isAuthenticated, tokens handled via effects)
* - Veramo agent + DID + signature
* - Identities list (`id`), metadata (`meta`)
* - Notifications + websocket connection
*
* Responsibilities:
* - Restore session on mount (checks access token, refresh if needed)
* - Persist DID/signature/meta to localStorage
* - Periodically refresh access token
* - Open a WebSocket for notifications when DID + token exist
* - Provide a unified logout handler
*/
export const AgentProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [agent, setAgent] = useState(null);
    const [did, setDid] = useState(() => localStorage.getItem('did'));
    const [signature, setSignature] = useState(() => localStorage.getItem('signature'));
    const [id, setIdentity] = useState([]);
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [meta, setMeta] = useState(() => {
        // lazy init from localStorage
        try {
            const raw = localStorage.getItem('meta');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const { disconnect } = useWeb3AuthDisconnect();
   
    // Logout helper (clears state + storage, disconnects Web3Auth)
    const handleLogout = useCallback(() => {
        logoutUser({ setAgent, setDid, setSignature, setMeta, disconnect, setIsAuthenticated });
    }, [setAgent, setDid, setSignature, setMeta, disconnect, setIsAuthenticated]);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Restore session on mount: check access token or use refresh token
    const restoreIdentities = async (sig) => {
        const ids = await getIdentities(sig);
        setIdentity(ids.identities);
    }

    useEffect(() => {
        const restoreSession = async () => {
            const storedDid = localStorage.getItem('did');
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const storedSignature = localStorage.getItem('signature');

            if (storedSignature && signature !== storedSignature) {
                setSignature(storedSignature)
            }
            if (!storedDid) return;

            try {
                if (accessToken && !isTokenExpired(accessToken)) {
                    await restoreIdentities(storedSignature);
                    setIsAuthenticated(true);
                } else if (refreshToken) {
                    const newAccess = await refreshAccessToken(refreshToken);
                    localStorage.setItem('accessToken', newAccess);
                    await restoreIdentities(storedSignature);
                    setIsAuthenticated(true);
                } else {
                    handleLogout();
                }
            } catch (err) {
                console.warn(err);
                handleLogout();
            }
        };
        restoreSession();
    }, [handleLogout, signature]);

    // Persist DID/signature/meta to localStorage when they change
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
   
    // Background token refresh every 5 minutes
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

    // Open a WebSocket for notifications tied to DID + access token
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!did || !token) return;
        const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost  = location.host;
        const WS_BASE = (import.meta.env.VITE_WS_URL || '/ws').replace(/\/+$/, '')
        const path = `${WS_BASE}/notifications/${encodeURIComponent(did)}/`
        const wsUrl = `${wsProto}//${wsHost}${path}?token=${encodeURIComponent(token)}`
        const newSocket = new WebSocket(wsUrl);

        setSocket(newSocket);

        newSocket.onopen = () => console.log("WebSocket connected.");
        newSocket.onmessage = (e) => setNotifications(prev => [...prev, JSON.parse(e.data)]);
        newSocket.onclose = (e) => console.log("WebSocket disconnected.", e);
        newSocket.onerror = (err) => console.error("WebSocket error:", err);
        
        return () => {
            newSocket.close();
        };
    }, [did]);

    // Memorize context value to avoid unnecessary re-renders
    const value = useMemo(() => ({
        agent, 
        setAgent, 
        did, 
        setDid, 
        id, 
        setIdentity, 
        signature, 
        setSignature, 
        meta, 
        setMeta, 
        notifications, 
        setNotifications,
        clearNotifications,
        handleLogout,
        socket,
        isAuthenticated, 
        setIsAuthenticated
    }), [agent, did, id, signature, meta, notifications, socket, handleLogout, clearNotifications, isAuthenticated]);

    return (
        <AgentContext.Provider value={ value }>{ children }</AgentContext.Provider>
    );
};