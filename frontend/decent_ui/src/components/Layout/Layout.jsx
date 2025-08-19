import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './sidebar';

import { useAgent } from '../../services/AgentContext';
import { useWeb3AuthConnect } from "@web3auth/modal/react";

import { Box, Toolbar, Container, CssBaseline } from "@mui/material";

import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const showSidebar = location.pathname !== '/'; 
    const isLoginPage = location.pathname === '/';

    const { isConnected } = useWeb3AuthConnect();
    const { did, agent } = useAgent();

    const loggedIn = isConnected && did;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <Header loggedIn={loggedIn}/>
            {showSidebar && <SidebarLeft />}
            <Box 
                component="main"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                <Toolbar />
                <Box sx={{ pt: 4}}>
                    {isLoginPage ? (
                        children
                    ) : (
                    <Container maxWidth={false} align='center'>{children}</Container>
                    )}
                </Box>
                <Footer />
            </Box>
        </Box>
    );
};

export default Layout;