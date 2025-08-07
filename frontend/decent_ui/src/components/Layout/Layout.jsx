import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './sidebar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { useLocation } from 'react-router-dom';


const Layout = ({ children }) => {
    const location = useLocation();
    const showSidebar = location.pathname !== '/'; 
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <Header />
            {showSidebar && <SidebarLeft />}
            <Box 
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                <Toolbar />
                <Box sx={{ flexGrow: 1, pt:4}}>
                    {location.pathname === '/' ? (
                        children
                    ) : (
                    <Container maxWidth="lg" align='center'>{children}</Container>
                    )}
                </Box>
                <Footer />
            </Box>
        </Box>
    );
};

export default Layout;