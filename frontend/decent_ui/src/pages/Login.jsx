import React, { useEffect } from 'react';
import HeroSection from '../components/Misc/HeroSection';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useAgent } from '../services/AgentContext';

/**
 * Login
 * 
 * Landing / Login oage of the application.
 * - Renders HeroSection with welcome text and login button.
 * - Checks authentication status (via Web3Auth + Agent).
 * - If already logged in, automatically redirects user to '/dashboard'.
 */

const Login = () => {
    const navigate = useNavigate();
    const { isConnected } = useWeb3AuthConnect();
    const { isAuthenticated } = useAgent();
    
    const loggedIn = isConnected && isAuthenticated;

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (loggedIn) {
            navigate('/dashboard');
        }
    }, [loggedIn, navigate]);

    return (
        <Box sx={{ m: 0, p: 0 }}>
            <HeroSection />
        </Box>
    );
};

export default Login;