import React from 'react';
import Carousel from 'react-material-ui-carousel';
import { Box } from '@mui/material';
import IdentityCard from '../Cards/IdentityCard';

export default function CardCarousel({ identities }) {
    if (!Array.isArray(identities) || identities.length === 0) return null;
    
    return (
        <Box sx={{ pb: 6 }}>
            <Carousel 
                indicators
                navButtonsAlwaysVisible
                animation='slide'
                navButtonsProps={{          
                    style: {
                        backgroundColor: '#4A87D0',
                    }
                }}
            >
                {identities.map(identity => (
                    <Box key={identity.id} sx={{ px: 2, maxWidth: '1200px' }}>
                        <IdentityCard identity={identity} />
                    </Box>
                ))}
            </Carousel>
        </Box>
    );
}