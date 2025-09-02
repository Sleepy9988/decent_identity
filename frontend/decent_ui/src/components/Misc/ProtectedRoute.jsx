import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useWeb3AuthConnect } from '@web3auth/modal/react';
import { useAgent } from '../../services/AgentContext';

/**
 * ProtectedRoute
 * 
 * Wrapper fro react-router routes that require authentication.
 * - Checks if user is both connected (via Web3Auth) and authenticated (via agent).
 * - If logged in: renders child routes via <Outlet />
 * - If not: redirects to the home page "/".
 * 
 * https://www.geeksforgeeks.org/reactjs/what-are-protected-routes-in-react-js/
 */

const ProtectedRoute = () => {
    const { isConnected } = useWeb3AuthConnect();
    const { isAuthenticated } = useAgent();

    const loggedIn = isConnected && isAuthenticated;

    return loggedIn ? <Outlet /> : <Navigate to="/" replace />
};

export default ProtectedRoute;