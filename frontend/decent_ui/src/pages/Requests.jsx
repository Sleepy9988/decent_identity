import React, { useState, useEffect, useCallback } from 'react';

import { Container, Box, Typography, Tabs, Tab, Divider } from '@mui/material';
import RequestForm from '../components/Forms/RequestForm';
import RequestCardList from '../components/Cards/RequestCardList';

import { getRequests} from '../components/helper';
import { useAgent } from '../services/AgentContext';

const Requests = () => {
    const [value, setValue] = useState("1");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const { did } = useAgent();

    const loadRequest = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getRequests();
            setRequests(res.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequest();
    }, [loadRequest]);

    const handleRequestCreation = async () => {
        loadRequest();
    };

    const handleChange = (e, newValue) => {
        setValue(newValue);
    };

    const created_reqs = requests.filter((req) => req.requestor_did === did);
    const received_reqs = requests.filter((req) => req.holder_did === did);

    return (
        <Box>
            <Box component='section' sx={{ mt: 4, display: 'flex', justifyContent: 'space-between'}}>
                <Typography variant="h3" gutterBottom align="left">
                    Requests
                </Typography> 
            </Box>
            <Divider />
            <Container component='section' sx={{ mt: 4}}>
                <Tabs value={value} onChange={handleChange} centered>
                    <Tab label='New Request' sx={{fontSize: '1rem', mr: 5}} value="1" />
                    <Tab label='Received Requests' sx={{fontSize: '1rem', mr: 5}} value="2" />
                    <Tab label='Created Requests' sx={{fontSize: '1rem'}} value="3" />
                </Tabs>
                {value === "1" && <RequestForm onNewRequest={handleRequestCreation} />}
                {value == "2" && (
                    <> 
                        {loading && <Typography sx={{ mt: 3 }}>Loading...</Typography>}
                        
                        {!loading && <RequestCardList requests={received_reqs} canDecide={true} onUpdate={loadRequest} />}
                    </>
                )}
                {value == "3" && (
                    <> 
                        {loading && <Typography sx={{ mt: 3 }}>Loading...</Typography>}
                        
                        {!loading && <RequestCardList requests={created_reqs} canDecide={false} onUpdate={loadRequest} />}
                    </>
                )}
            </Container>
        </Box>
    );
};

export default Requests;