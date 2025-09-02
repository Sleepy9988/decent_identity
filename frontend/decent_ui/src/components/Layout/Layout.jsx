import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './sidebar';

import { useAgent } from '../../services/AgentContext';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { Box, Toolbar, Container, CssBaseline } from "@mui/material";
import { useLocation } from 'react-router-dom';

/**
 * Global page layout wrapper.
 * - Provides persistent Header, Footer, and Sidebar (conditionally)
 * - Handles responsive flexbox structure with main content area. 
 * - Uses React Router useLocation to hide sidebar on login page ('/')
 * 
 * Props:
 * - children: page-specific content rendered in the main area
 */

const Layout = ({ children }) => {
    const location = useLocation();
    const showSidebar = location.pathname !== '/'; 
    const isLoginPage = location.pathname === '/';

    const { isConnected } = useWeb3AuthConnect();
    const { isAuthenticated } = useAgent();

    const loggedIn = isConnected && isAuthenticated;

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
                {/* Offset for fixed Header */}
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