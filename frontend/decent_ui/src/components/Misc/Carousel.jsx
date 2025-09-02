import React from 'react';
import Carousel from 'react-material-ui-carousel';
import { Box, Typography } from '@mui/material';
import IdentityCard from '../Cards/IdentityCard';

/**
 * CardCarousel
 * 
 * Renders a carousel of IdentityCard components
 * - Uses react-material-ui-carousel for sliding navigation.
 * - Shows navigation buttons & indicators, disables autoPlay.
 * 
 * Props:
 * - identities: array of identity objects 
 */

export default function CardCarousel({ identities }) {
    if (!Array.isArray(identities) || identities.length === 0) 
        return <Typography> You don't have any identities yet.</Typography>;
   
    return (
        <Carousel 
            indicators
            navButtonsAlwaysVisible
            animation='slide'
            autoPlay={false}
            cycleNavigation={true}
            navButtonsProps={{style: {backgroundColor: '#4A87D0'}}}>
            
            {identities.map((identity) => (
                <Box key={identity.id} sx={{ px: 2, maxWidth: '1200px' }}>
                    <IdentityCard identity={identity} />
                </Box>
            ))}
        </Carousel>
    );
}