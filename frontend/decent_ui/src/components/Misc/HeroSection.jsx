import React from "react";
import { Box, Container, Typography } from '@mui/material';
import { ConnectWeb3AuthButton } from '../Buttons';

export default function HeroSection() {
    return (
        <Box 
            sx={{
                position: 'relative',
                top: 70,
                padding: 0,
                width: '100vw',
                height: '75vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: `linear-gradient(to right,rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.7)), url('/assets/hero.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                color: 'white',
                textShadow: '1px 1px 6px rgba(0, 0, 0, 0.7)',           
            }}
        >
            <Box 
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(183, 187, 201, 0.9)',
                    clipPath: 'polygon(0 0, 50% 0, 25% 100%, 0% 100%)',
                    zIndex: 1,
                }}
            />
            <Container maxWidth="lg" sx={{ textAlign: 'initial', zIndex: 2 }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Welcome to DIDHub 
                </Typography>
                <Typography variant="h4">
                    Decentralized Identity & Profile Management
                </Typography>
                <Container sx={{ pt: 5}}>
                    <ConnectWeb3AuthButton />
                </Container>
            </Container>
        </Box>
    )
}