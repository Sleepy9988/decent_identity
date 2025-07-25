import React from "react";
import { Box, Container, Typography } from '@mui/material';
import { ConnectWeb3AuthButton } from '../Buttons';

export default function HeroSection() {
    return (
        <Box 
            sx={{
                position: 'relative',
                margin: 0, 
                padding: 0,
                width: '100vw',
                height: '50vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url('/assets/hero.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                color: 'white',
                textShadow: '1px 1px 6px rgba(0, 0, 0, 0.7)',
                
            }}
        >
            
            <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Welcome to DIDHub 
                </Typography>
                <Typography variant="h4">
                    Decentralized Identity & Profile Management
                </Typography>
                <Container sx={{ pt: 5 }}>
                    <ConnectWeb3AuthButton />
                </Container>
            </Container>
        </Box>
    )
}