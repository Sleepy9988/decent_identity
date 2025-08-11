import React from 'react';
import { useWeb3AuthConnect } from "@web3auth/modal/react";

import { checkDidOnChain } from '../components/helper.js';
import { useAgent } from '../services/AgentContext';

import { Box, Container, Typography, Button, Card, CardContent, Divider } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import CardCarousel from '../components/Misc/Carousel';

const Dashboard = () => {
    const { isConnected } = useWeb3AuthConnect();
    const { did, id } = useAgent();
    const loggedIn = isConnected && did;
    
    if (!loggedIn) return null;

    const did_display = did.split(":")[3];

    return (
        <Box>
            <Box component="section" sx={{ mt: 4}}>
                <Typography variant="h3" gutterBottom align="left">
                    Dashboard
                </Typography>  
            </Box>
            <Divider />
            <Container component="section" sx={{ mt: 4}}>
                <Card variant='outlined' sx={{ borderRadius: 3, p: 1, backgroundColor: '#1d2f40', mt: 5 }}>
                    <CardContent>
                        <Typography align="left" sx={{ fontSize: '1.5rem'}}>Logged in as:</Typography>
                        <Box 
                            sx={{
                                mt: 1,
                                p: 2,
                                backgroundColor: '#2d4963',
                                borderRadius: 2, 
                                fontFamily: 'monospace',
                                fontSize: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            {did_display}
                            <IconButton 
                                aria-label="copy" 
                                onClick={() => navigator.clipboard.writeText(did)}>
                                <ContentCopyIcon fontSize="medium" />
                            </IconButton>
                        </Box>
                    </CardContent>
                </Card>
                
                <Button onClick={() => checkDidOnChain(did)}>Check did on Chain</Button>
            </Container>
            <Divider sx={{mt: 5}}/>
            <Container maxWidth="xl" sx={{ mt: 5 }}>
                <Typography variant="h5" sx={{textAlign: 'start', mb: 3}}>
                    Existing Identities
                </Typography>
                {id && <CardCarousel identities={id} />}
            </Container>
        </Box>
    );
};

export default Dashboard;