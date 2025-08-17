import React, { useEffect } from 'react';
import HeroSection from '../components/Misc/HeroSection';
import Box from '@mui/material/Box';

import { useNavigate } from 'react-router-dom';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useAgent } from '../services/AgentContext';

const Login = () => {
    const navigate = useNavigate();
    const { isConnected } = useWeb3AuthConnect();
    const { did } = useAgent();
    
    const loggedIn = isConnected && did;

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