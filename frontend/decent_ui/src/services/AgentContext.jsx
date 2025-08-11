import React, { createContext, useContext, useState, useEffect } from 'react';
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
    //const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
    const [signature, setSignature] = useState(null);
    const [id, setIdentity] = useState([]);

    const { connect, isConnected, disconnect } = useWeb3AuthConnect();
    
    const handleLogout = () => {
        logoutUser({ setAgent, setDid, disconnect });
    }

    useEffect(() => {
        const restoreSession = async () => {
            const storedDid = localStorage.getItem('did');
            const signature = localStorage.getItem('signature');

            if (storedDid) setDid(storedDid);
            if (signature) setSignature(signature);

            if (!isConnected && storedDid) {
                try {
                    await connect();
                    const ids = await getIdentities(signature);
                    setIdentity(ids.identities);
                } catch (err) {
                    console.warn("Token refresh failed. Logging out.", err);
                    handleLogout();
                }
            }
        };
        restoreSession();
    }, []);

    useEffect(() => {
        if (did) {
            localStorage.setItem('did', did);
        } else {
            localStorage.removeItem('did');
        }
    }, [did]);

    useEffect(() => {
        if (signature) {
            localStorage.setItem('signature', signature);
        } else {
            localStorage.removeItem('signature');
        }
    }, [signature]);
   
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
    }, [agent, did]);

    return (
        <AgentContext.Provider 
            value={{ 
                agent, setAgent, did, setDid, id, setIdentity, signature, setSignature
            }}
        >
            { children }
        </AgentContext.Provider>
    );
};