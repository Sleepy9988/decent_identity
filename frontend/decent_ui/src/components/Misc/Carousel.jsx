import React from 'react';
import Carousel from 'react-material-ui-carousel';
import { Card, Container, CardContent, Typography, Box, Divider } from '@mui/material';

export default function CardCarousel({ identities }) {
    if (!Array.isArray(identities) || identities.length === 0) return null;
    
    return (
        <Container sx={{ my: 4 }} >
            <Carousel navButtonsAlwaysVisible
                navButtonsProps={{          
                    style: {
                        backgroundColor: '#4A87D0',
                    }
                }}
            >
                {identities.map((identity) => {
                    const { context, description, issued, decrypted_data } = identity;
                    return (
                        <Card key={identity.id} sx={{ p: 2, backgroundColor: '#2d4963', borderRadius: 3, color: '#fff' }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>
                                    {context}
                                </Typography>
                                <Typography variant="subtitle1" gutterBottom sx={{ color: '#ccc' }}>
                                    {description}
                                </Typography>

                                <Divider sx={{ my: 2, borderColor: 'white'}} />

                                <Box component="dl" sx={{ mb: 2 }}>
                                    {Object.entries(decrypted_data).map(([key, value]) => (
                                        <Box key={key} sx={{ display: 'flex', mb: 1 }}>
                                            <Typography component="dt" sx={{ fontWeight: 600, minWidth: 100 }}>
                                                {key}:
                                            </Typography>
                                            <Typography component="dd" sx={{ ml: 1 }}>
                                                {value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box> 
                                <Typography variant="caption" sx={{ color: '#aaa' }}>
                                    Issued: {new Date(issued).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    );
                })}
            </Carousel>
        </Container>
    );
}