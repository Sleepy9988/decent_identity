import React from "react";
import { Box, Container, Typography } from '@mui/material';
import { ConnectWeb3AuthButton } from '../Buttons';

/**
 * HeroSection 
 * 
 * Landing page hero banner.
 * - Full viewport width, 75% viewport height
 * - Background: hero image with gradient overlay
 * - Adds angled polygon accent on the left via clipPath
 * - Displays title, subtitle, and a login button.
 */

export default function HeroSection() {
    return (
        <Box 
            sx={{
                position: 'relative',
                top: { xs: 56, sm: 70 }, 
                p: 0,
                width: '100%',
                height: { xs: '60vh', md: '75vh' },
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
            {/* Left-side angled overlay accent */}
            <Box 
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(183, 187, 201, 0.9)',
                    clipPath: { xs: 'polygon(0 0, 60% 0, 30% 100%, 0% 100%)', md: 'polygon(0 0, 50% 0, 25% 100%, 0% 100%)' },
                    zIndex: 1,
                }}
            />
            {/* Foreground content */}
            <Container maxWidth="lg" sx={{ textAlign: 'initial', zIndex: 2 }}>
                <Typography component="h1" gutterBottom sx={{ typography: { xs: 'h4', sm: 'h3', md: 'h2' } }}>
                    Welcome to DIDHub 
                </Typography>
                <Typography sx={{ typography: { xs: 'subtitle1', sm: 'h6', md: 'h4' } }}>
                    Decentralized Identity & Profile Management
                </Typography>
                <Container sx={{ pt: { xs: 3, sm: 5 } }}>
                    <ConnectWeb3AuthButton />
                </Container>
            </Container>
        </Box>
    )
}