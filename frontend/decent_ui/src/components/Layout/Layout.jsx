import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './Sidebar';

import { useAgent } from '../../services/AgentContext';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { Box, Toolbar, Container, CssBaseline } from "@mui/material";
import { useLocation, Navigate } from 'react-router-dom';

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
    const [mobileOpen, setMobileOpen] = useState(false);
    const handleDrawerToggle = () => setMobileOpen((o) => !o);

    const location = useLocation();
    const showSidebar = location.pathname !== '/'; 
    const isLoginPage = location.pathname === '/';

    const { isConnected } = useWeb3AuthConnect();
    const { isAuthenticated } = useAgent();

    const loggedIn = isConnected && isAuthenticated;

    if (!loggedIn && !isLoginPage) {
        return <Navigate to="/" replace />
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <Header loggedIn={loggedIn} onMenuClick={handleDrawerToggle} />
            {showSidebar && (
                <SidebarLeft mobileOpen={mobileOpen} onClose={handleDrawerToggle}/>
            )}
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
                    <Container maxWidth={false} align='center' sx={{ px: { xs: 2, sm: 3, md: 4 } }}>{children}</Container>
                    )}
                </Box>
                <Footer />
            </Box>
        </Box>
    );
};

export default Layout;