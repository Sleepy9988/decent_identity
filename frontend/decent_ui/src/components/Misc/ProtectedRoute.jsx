import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useWeb3AuthConnect } from '@web3auth/modal/react';

import { useAgent } from '../../services/AgentContext';

const ProtectedRoute = () => {
    const { isConnected } = useWeb3AuthConnect();
    const { did } = useAgent();

    const loggedIn = isConnected && did;

    return loggedIn ? <Outlet /> : <Navigate to="/" replace />
};

export default ProtectedRoute;