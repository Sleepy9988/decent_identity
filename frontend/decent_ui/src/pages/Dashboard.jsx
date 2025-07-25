import React from 'react';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useNavigate } from 'react-router-dom';

import { SubmitVCButton } from '../components/Buttons';
import { checkDidOnChain } from '../components/helper.js';
import { useAgent } from '../services/AgentContext.jsx';

import { Box, Container, Icon, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';


const Dashboard = () => {
    const { isConnected } = useWeb3AuthConnect();
    const { did } = useAgent();
    const navigate = useNavigate();
    const loggedIn = isConnected && did;

    React.useEffect(() => {
        if (!loggedIn) {
            navigate('/');
        }
    }, [loggedIn, navigate]);

    if (!loggedIn) return null;

    return (
        <Container>
            <Box component="section" sx={{ mt: 4}}>
                <Typography variant="h3" gutterBottom align="left">
                    Dashboard
                </Typography>  
            </Box>
            
            <Box component="section" sx={{ mt: 4}}>
                <Divider />
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
                            
                        }}
                    >
                        {did}
                        <IconButton aria-label="copy" 
                            sx={{pl:2}} 
                            onClick={() => navigator.clipboard.writeText(did)}>
                            <ContentCopyIcon fontSize="large" />
                        </IconButton>
                    </Box>
                    </CardContent>
                </Card>
                
                <Button onClick={() => checkDidOnChain(did)}>Check did on Chain</Button>
                <SubmitVCButton/>
            </Box>
        </Container>
    );
};

export default Dashboard;